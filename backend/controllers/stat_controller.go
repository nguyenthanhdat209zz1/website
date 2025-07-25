package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
)

func GetStats(c *gin.Context) {
	var userCount, postCount, commentCount int64
	var userNew, postNew, commentNew int64
	now := time.Now()
	weekAgo := now.AddDate(0, 0, -7)

	config.DB.Model(&models.User{}).Count(&userCount)
	config.DB.Model(&models.Post{}).Count(&postCount)
	config.DB.Model(&models.Comment{}).Count(&commentCount)
	config.DB.Model(&models.User{}).Where("created_at >= ?", weekAgo).Count(&userNew)
	config.DB.Model(&models.Post{}).Where("created_at >= ?", weekAgo).Count(&postNew)
	config.DB.Model(&models.Comment{}).Where("created_at >= ?", weekAgo).Count(&commentNew)

	c.JSON(http.StatusOK, gin.H{
		"userCount":    userCount,
		"postCount":    postCount,
		"commentCount": commentCount,
		"userNew":      userNew,
		"postNew":      postNew,
		"commentNew":   commentNew,
	})
}

type UserStat struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	PostCount   int    `json:"post_count"`
	AnswerCount int    `json:"answer_count"`
	LikeCount   int    `json:"like_count"`
	ViewCount   int    `json:"view_count"`
	Score       int    `json:"score"`
	Badge       string `json:"badge"`
}

func GetLeaderboard(c *gin.Context) {
	sortBy := c.DefaultQuery("sort", "score")
	var users []models.User
	config.DB.Preload("Role").Preload("Posts").Preload("Answers").Find(&users)
	var stats []UserStat
	for _, u := range users {
		likeCount := 0
		viewCount := 0
		for _, p := range u.Posts {
			likeCount += int(p.LikeCount)
			viewCount += int(p.ViewCount)
		}
		score := len(u.Posts)*10 + len(u.Answers)*5 + likeCount*2 + viewCount/10
		badge := "Đồng"
		if score >= 300 {
			badge = "Kim cương"
		} else if score >= 150 {
			badge = "Vàng"
		} else if score >= 50 {
			badge = "Bạc"
		}
		stats = append(stats, UserStat{
			ID: u.ID, Name: u.Name, Email: u.Email, Role: u.Role.Name,
			PostCount: len(u.Posts), AnswerCount: len(u.Answers), LikeCount: likeCount, ViewCount: viewCount, Score: score, Badge: badge,
		})
	}
	// Sắp xếp theo tiêu chí
	switch sortBy {
	case "like":
		sort.Slice(stats, func(i, j int) bool { return stats[i].LikeCount > stats[j].LikeCount })
	case "view":
		sort.Slice(stats, func(i, j int) bool { return stats[i].ViewCount > stats[j].ViewCount })
	case "contribution":
		sort.Slice(stats, func(i, j int) bool {
			return (stats[i].PostCount + stats[i].AnswerCount) > (stats[j].PostCount + stats[j].AnswerCount)
		})
	default:
		sort.Slice(stats, func(i, j int) bool { return stats[i].Score > stats[j].Score })
	}
	c.JSON(http.StatusOK, stats)
}
