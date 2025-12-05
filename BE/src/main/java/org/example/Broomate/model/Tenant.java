package org.example.Broomate.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Tenant extends Account {
//human criteria
    private Integer age;
    private GenderEnum gender;
    private Integer stayLengthMonths;
    private String moveInDate;  // ISO date string: "YYYY-MM-DD"
   private boolean isSmoking;
   private boolean isCooking;

    //room criteria
    private Double budgetPerMonth;
    private List<String> preferredDistricts;  // ["District 1", "District 2"]
    private boolean needWindow;
    private boolean mightShareBedRoom;
    private boolean mightShareToilet;


    // Note: swipeHistory, bookmarkedRooms, matches are NOT stored in Tenant document
    // They are stored in separate collections (swipes, bookmarks, matches)
    // and queried using tenantId as foreign key


    public enum GenderEnum {
        MALE,
        FEMALE,
        OTHER
    }
}
