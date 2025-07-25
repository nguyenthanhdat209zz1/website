package models

import "gorm.io/gorm"

type Report struct {
	gorm.Model
	Type     string `json:"type"` // post hoặc comment
	TargetID uint   `json:"target_id"`
	Content  string `json:"content"`
	UserID   uint   `json:"user_id"`
	User     User   `json:"user" gorm:"foreignKey:UserID"`
}
