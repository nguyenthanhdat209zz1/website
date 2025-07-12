package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetCommentsByPost(c *gin.Context) {
	var comments []models.Comment
	config.DB.Preload("User").Where("post_id = ?", c.Param("postId")).Order("created_at asc").Find(&comments)
	c.JSON(http.StatusOK, comments)
}

func CreateComment(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)

	var input struct {
		Content string `json:"content"`
		PostID  uint   `json:"post_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || len(input.Content) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ hoặc nội dung rỗng"})
		return
	}

	comment := models.Comment{
		Content: input.Content,
		PostID:  input.PostID,
		UserID:  user.ID,
	}
	if err := config.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo bình luận"})
		return
	}
	config.DB.Preload("User").First(&comment, comment.ID)
	c.JSON(http.StatusOK, comment)
}

func GetAllComments(c *gin.Context) {
	var comments []models.Comment
	config.DB.Preload("User").Preload("Post").Order("created_at desc").Find(&comments)
	c.JSON(http.StatusOK, comments)
}

func DeleteComment(c *gin.Context) {
	id := c.Param("id")
	var comment models.Comment
	if err := config.DB.First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy bình luận"})
		return
	}
	if err := config.DB.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi xóa bình luận"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Xóa bình luận thành công"})
}

func GetUsers(c *gin.Context) {
	var users []models.User
	config.DB.Preload("Role").Find(&users)
	c.JSON(200, users)
}
