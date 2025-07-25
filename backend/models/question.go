package models

import "gorm.io/gorm"

type Question struct {
	gorm.Model
	Title   string   `json:"title"`
	Content string   `json:"content"`
	UserID  uint     `json:"user_id"`
	User    User     `json:"user" gorm:"foreignKey:UserID"`
	Tag     string   `json:"tag"`
	Answers []Answer `json:"answers" gorm:"foreignKey:QuestionID"`
}

type Answer struct {
	gorm.Model
	Content    string       `json:"content"`
	UserID     uint         `json:"user_id"`
	User       User         `json:"user" gorm:"foreignKey:UserID"`
	QuestionID uint         `json:"question_id"`
	Tag        string       `json:"tag"`
	Votes      []AnswerVote `json:"votes" gorm:"foreignKey:AnswerID"`
	VoteCount  int          `json:"vote_count" gorm:"-"`
}

type AnswerVote struct {
	gorm.Model
	UserID   uint `json:"user_id"`
	AnswerID uint `json:"answer_id"`
	Value    int  `json:"value"`
}
