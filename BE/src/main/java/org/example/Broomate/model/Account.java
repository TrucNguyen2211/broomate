package org.example.Broomate.model;


import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)

public class    Account extends BaseModel {

    private String email;
    private String password;  // Store hashed password
    private String name;
    private String phone;
    private String avatarUrl;
    private String description;
    private AccountRoleEnum role;  // TENANT or LANDLORD
    @Builder.Default
    private boolean active = true;

    public enum AccountRoleEnum {
        TENANT,
        LANDLORD
    }
}