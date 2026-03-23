package jar.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;

@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String email;
    private String mobile;
    private String plan;
    private String trainer;
    private LocalDateTime joinDate;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public Member() {}

    public Member(Integer id, String name, String email, String mobile, String plan, String trainer, LocalDateTime joinDate, LocalDateTime startDate, LocalDateTime endDate) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.mobile = mobile;
        this.plan = plan;
        this.trainer = trainer;
        this.joinDate = joinDate;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getTrainer() { return trainer; }
    public void setTrainer(String trainer) { this.trainer = trainer; }

    public LocalDateTime getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDateTime joinDate) { this.joinDate = joinDate; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    @Transient
    public String getStatus() {
        if (endDate == null) return "Unknown";
        return endDate.isBefore(LocalDateTime.now()) ? "Expired" : "Active";
    }
}