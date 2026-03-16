package jar.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import jar.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Integer> {

}