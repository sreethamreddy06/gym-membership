package jar.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jar.entity.Member;
import jar.repository.MemberRepository;

@Service
public class AssistantService {

    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final String apiUrl;

    public AssistantService(
            MemberRepository memberRepository,
            ObjectMapper objectMapper,
            @Value("${openai.api-key:}") String apiKey,
            @Value("${openai.model:gpt-5-mini}") String model,
            @Value("${openai.api-url:https://api.openai.com/v1/responses}") String apiUrl) {
        this.memberRepository = memberRepository;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
        this.restClient = RestClient.builder().build();
    }

    public String ask(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI assistant is not configured yet. Add OPENAI_API_KEY to the project .env file.");
        }

        try {
            JsonNode response = restClient.post()
                    .uri(apiUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(buildPayload(message))
                    .retrieve()
                    .body(JsonNode.class);

            if (response != null && response.hasNonNull("output_text")) {
                return response.get("output_text").asText().trim();
            }

            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI response was empty.");
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to get a response from the AI assistant right now.");
        }
    }

    private ObjectNode buildPayload(String message) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", model);
        payload.put("instructions", buildInstructions());
        payload.put("input", buildGymContext() + "\n\nUser question: " + message);

        ObjectNode reasoning = payload.putObject("reasoning");
        reasoning.put("effort", "low");

        ObjectNode text = payload.putObject("text");
        text.put("verbosity", "medium");
        return payload;
    }

    private String buildInstructions() {
        return "You are a helpful AI gym membership assistant for staff. "
                + "Answer using the gym roster context provided. "
                + "Be concise, practical, and business-focused. "
                + "Help with membership plans, renewals, trainer assignments, and quick operational guidance. "
                + "If the answer depends on missing information, say what is missing instead of inventing it.";
    }

    private String buildGymContext() {
        List<Member> members = memberRepository.findAll();
        long activeCount = members.stream().filter(member -> "Active".equalsIgnoreCase(member.getStatus())).count();
        long expiringSoon = members.stream()
                .filter(member -> member.getEndDate() != null)
                .filter(member -> !member.getEndDate().toLocalDate().isBefore(LocalDate.now()))
                .filter(member -> ChronoUnit.DAYS.between(LocalDate.now(), member.getEndDate().toLocalDate()) <= 7)
                .count();

        String memberLines = members.stream()
                .sorted(Comparator.comparing(Member::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(12)
                .map(this::formatMember)
                .collect(Collectors.joining("\n"));

        return "Gym dashboard context:\n"
                + "- Today: " + LocalDate.now() + "\n"
                + "- Total members: " + members.size() + "\n"
                + "- Active members: " + activeCount + "\n"
                + "- Expiring within 7 days: " + expiringSoon + "\n"
                + "- Standard plans: Monthly = Rs. 5000, Yearly = Rs. 15000\n"
                + "- Sample roster snapshot:\n"
                + (memberLines.isBlank() ? "No members available yet." : memberLines);
    }

    private String formatMember(Member member) {
        return "* " + nullSafe(member.getName())
                + " | plan: " + nullSafe(member.getPlan())
                + " | trainer: " + nullSafe(member.getTrainer())
                + " | status: " + nullSafe(member.getStatus())
                + " | end: " + formatDateTime(member.getEndDate());
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "n/a" : value.toLocalDate().toString();
    }

    private String nullSafe(String value) {
        return value == null || value.isBlank() ? "n/a" : value;
    }
}
