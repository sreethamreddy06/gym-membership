package jar.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jar.entity.Member;
import jar.service.MemberService;

@CrossOrigin(origins = "*")
@RestController
public class MemberController {

    @Autowired
    private MemberService memberService;

    @GetMapping("/")
    public String home() {
        return "Welcome to Gym Membership Backend";
    }

    @GetMapping("/members")
    public List<Member> getMembers() {
        return memberService.getAllMembers();
    }

    @PostMapping("/members/add")
    public Member addMember(@RequestBody Member member) {
        return memberService.saveMember(member);
    }

    @PutMapping("/members/update")
    public Member updateMember(@RequestBody Member member) {
        return memberService.saveMember(member);
    }

    @DeleteMapping("/members/delete/{id}")
    public void deleteMember(@PathVariable int id) {
        memberService.deleteMember(id);
    }
}