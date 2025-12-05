import React, { useState, useMemo } from 'react';
// Importing resuable component
import Button from '@/components/common/Button';     
import Icon from '@/components/common/Icon';
import ProfileCard from '@/components/tenant/ProfileCard';

import './ProfileMatch.css'; 
import { mockMatchCandidates } from '../../../data/MockData'; // Placeholder for mock data, used only for testing

/**
 * ProfileMatch Component
 * Show user and handle match/reject
 */
const ProfileMatch = () => {
    
    // 1. List of matchable user and current index
    const [candidates, setCandidates] = useState(mockMatchCandidates);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 2. Calculate display user data
    const currentCandidate = useMemo(() => {
        return candidates[currentIndex];
    }, [candidates, currentIndex]);

    // 3. Action handler: Pass
    const handlePass = () => {
        console.log(`Passing candidate: ${currentCandidate.id}`);
        // Store reject data within session
        moveToNextCandidate();
    };

    // 4. Action handler: Like
    const handleLike = () => {
        console.log(`Liking candidate: ${currentCandidate.id}`);
        // Cal matchmodal and show match if the liked user likes current user too
        // if (checkIfMatch()) { openMatchModal(); }
        moveToNextCandidate();
    };
    
    // 5. Logic to move to next user
    const moveToNextCandidate = () => {
        if (currentIndex < candidates.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // If all candidates are seen
            console.log("No more candidates!");
            // TODO: display 'No more candidates' screen
        }
    };

    // If no roomates are available
    if (!currentCandidate) {
        return <div className="no-candidates">No new roommate candidates at this time.</div>;
    }

    return (
        <div className="profile-match-container">
            
            {/* A. Profile Card Area (중앙에 카드를 배치) */}
            <div className="profile-card-wrapper">
                <ProfileCard 
                    profileData={currentCandidate} 
                    isEditable={false} // Unable to edit in match screen
                />
            </div>
            
            {/* B. Action Buttons (Forr swipe) */}
            <footer className="match-actions-footer">
                <Button
                    variant="circular-secondary" 
                    icon_name="close"
                    size="large-icon"
                    onClick={handlePass}
                    aria-label="Pass"
                />
                <Button
                    variant="circular-primary"
                    icon_name="heart"
                    size="large-icon"
                    onClick={handleLike}
                    aria-label="Like"
                />
            </footer>
        </div>
    );
};

export default ProfileMatch;