package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	ID       uint     `json:"id"`
	Name     string   `json:"name" gorm:"unique"`
	Email    string   `json:"email" gorm:"unique"`
	Password string   `json:"-"`
	RoleID   uint     `json:"role_id"`
	Role     Role     `json:"role" gorm:"foreignKey:RoleID"`
	Avatar   string   `json:"avatar"`
	Posts    []Post   `json:"posts" gorm:"foreignKey:UserID"`
	Answers  []Answer `json:"answers" gorm:"foreignKey:UserID"`
}

type Role struct {
	gorm.Model
	Name  string `gorm:"unique"`
	Rules []Rule `gorm:"many2many:role_rules"`
}

type Rule struct {
	gorm.Model
	Name string `gorm:"unique"`
}
