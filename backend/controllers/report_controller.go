package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateReport(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)

	var input struct {
		Type     string `json:"type"` // post hoặc comment
		TargetID uint   `json:"target_id"`
		Content  string `json:"content"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || len(input.Content) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ hoặc nội dung rỗng"})
		return
	}

	report := models.Report{
		Type:     input.Type,
		TargetID: input.TargetID,
		Content:  input.Content,
		UserID:   user.ID,
	}
	if err := config.DB.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể gửi báo cáo"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Đã gửi báo cáo!"})
}

func GetAllReports(c *gin.Context) {
	var reports []models.Report
	config.DB.Preload("User").Order("created_at desc").Find(&reports)
	c.JSON(http.StatusOK, reports)
}
