package jar.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jar.entity.Member;
import jar.repository.MemberRepository;

@Service
public class MemberService {

    @Autowired
    private MemberRepository repo;

    public Member saveMember(Member m) {
        if (m.getId() == null && m.getJoinDate() == null) {
            m.setJoinDate(LocalDateTime.now());
        }
        if (m.getStartDate() == null) {
            m.setStartDate(m.getJoinDate() != null ? m.getJoinDate() : LocalDateTime.now());
        }
        if (m.getEndDate() == null && m.getPlan() != null) {
            LocalDateTime start = m.getStartDate();
            String plan = m.getPlan().toLowerCase();
            if (plan.contains("monthly")) {
                m.setEndDate(start.plusMonths(1));
            } else if (plan.contains("yearly")) {
                m.setEndDate(start.plusYears(1));
            } else {
                // Default to 1 month if not specified
                m.setEndDate(start.plusMonths(1));
            }
        }
        return repo.save(m);
    }

    public List<Member> getAllMembers() {
        return repo.findAll();
    }

    public void deleteMember(int id) {
        repo.deleteById(id);
    }
}