import React from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import './ProfileCard.css';

function ProfileCard({ 
  userData, 
  onSwipeLeft, 
  onSwipeRight, 
  onReport 
}) {
  const {
    name = 'N/A',
    age = '??',
    gender = 'N/A',
    isSmoking = false,
    isCooking = false,
    moveInDate = 'N/A',
    photoUrl = 'placeholder.jpg'
  } = userData;
  
  return (
    <div 
      className="profile-card-root"
      style={{ backgroundImage: `url(${photoUrl})` }}
    >
      <div className="card-info-overlay">
        <h2 className="card-name-age">{`${name}, ${age}`}</h2>
        <p className="card-gender">{`Gender: ${gender}`}</p>
        
        <div className="card-badges-container">
          <Badge
            text={isSmoking ? "Smoker" : "Non-Smoker"}
            variant={isSmoking ? "danger" : "success"}
            iconName="smoke"
          />
          <Badge
            text={isCooking ? "Is Cooking" : "Does not cook"}
            variant={isCooking ? "success" : "info"}
            iconName="fork_knife"
          />
          <Badge
            text={`Move-in: ${moveInDate}`}
            variant="info"
            iconName="calendar"
          />
        </div>
        
        <div className="card-report-action">
          <Button
            text="Report"
            variant="ghost"
            size="small"
            iconName="report"
            onClick={onReport}
          />
        </div>
      </div>
      
      <div className="card-swipe-actions">
        <Button 
          variant="tenant" 
          iconName="skip" 
          isIconOnly={true} 
          onClick={onSwipeLeft}
        />
        <Button 
          variant="tenant" 
          iconName="like" 
          isIconOnly={true} 
          onClick={onSwipeRight}
        />
      </div>
    </div>
  );
}

export default ProfileCard;