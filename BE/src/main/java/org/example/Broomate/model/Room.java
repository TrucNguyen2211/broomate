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
public class Room extends BaseModel {

    private String landlordId;
    private String title;
    private String description;
    private String thumbnailUrl;
    private List<String> imageUrls;
    private List<String> videoUrls;
    private List<String> documentUrls;  // PDFs, contracts, CSV, Word docs
    private Double rentPricePerMonth;
    private Integer minimumStayMonths;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer numberOfToilets;
    private Integer numberOfBedRooms;
    private RoomStatus status;
    private boolean hasWindow;

    public enum RoomStatus {

        PUBLISHED,
        RENTED
    }
}