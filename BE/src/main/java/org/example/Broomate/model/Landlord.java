package org.example.Broomate.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Landlord extends Account {

    // Landlord has no additional fields beyond Account
    // Rooms owned by landlord are in separate "rooms" collection
    // Query: rooms.where("landlordId", "==", landlordId)

}