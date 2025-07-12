package models

import (
	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	Title        string `json:"title"`
	Content      string `json:"content"`
	UserID       uint   `json:"user_id"`
	User         User   `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ViewCount    uint   `json:"view_count" gorm:"default:0"`
	LikeCount    uint   `json:"like_count" gorm:"default:0"`
	DislikeCount uint   `json:"dislike_count" gorm:"default:0"`
	Approved     bool   `json:"approved" gorm:"default:false"`
}

type PostView struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint
	PostID uint
}

type PostReaction struct {
	ID       uint `gorm:"primaryKey"`
	UserID   uint
	PostID   uint
	Reaction string // "like" hoặc "dislike"
}
