package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
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
