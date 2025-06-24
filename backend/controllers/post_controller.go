package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// create
func CreatePost(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)

	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post.UserID = user.ID

	if err := config.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi tạo bài viết"})
		return
	}
	if err := config.DB.Preload("User").First(&post, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi load thông tin user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tạo bài viết thành công",
		"post":    post,
	})
}

// Read
func GetPosts(c *gin.Context) {
	var posts []models.Post
	config.DB.Preload("User").Order("created_at desc").Find(&posts)
	c.JSON(http.StatusOK, posts)
}

func GetPostByID(c *gin.Context) {
	id := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	c.JSON(http.StatusOK, post)
}

// Update
func UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	var updatedPost models.Post
	if err := c.ShouldBindJSON(&updatedPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post.Title = updatedPost.Title
	post.Content = updatedPost.Content
	config.DB.Save(&post)
	c.JSON(http.StatusOK, post)
}

// Delete
func DeletePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	result := config.DB.First(&post, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}

	if err := config.DB.Unscoped().Delete(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi xóa bài viết: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "xóa bài viết thành công"})
}

// Tìm kiếm bài viết theo tiêu đề
func SearchPosts(c *gin.Context) {
	keyword := c.Query("keyword")
	var posts []models.Post
	config.DB.Preload("User").Where("title LIKE ?", "%"+keyword+"%").Order("created_at desc").Find(&posts)
	c.JSON(200, posts)
}
