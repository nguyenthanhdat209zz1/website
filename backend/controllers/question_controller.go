package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Tạo câu hỏi mới
func CreateQuestion(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Tag     string `json:"tag"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}
	if len(input.Title) > 250 {
		c.JSON(400, gin.H{"error": "Tiêu đề không được vượt quá 250 ký tự!"})
		return
	}
	fmt.Println("Content length:", len(input.Content))
	if len(input.Content) > 2500 {
		c.JSON(400, gin.H{"error": "Câu hỏi không được vượt quá 2500 ký tự!"})
		return
	}
	if len(input.Tag) > 50 {
		c.JSON(400, gin.H{"error": "Thẻ không được vượt quá 50 ký tự!"})
		return
	}
	q := models.Question{
		Title:   input.Title,
		Content: input.Content,
		Tag:     input.Tag,
		UserID:  user.ID,
	}
	if err := config.DB.Create(&q).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo câu hỏi"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tạo câu hỏi thành công", "question": q})
}

// Lấy danh sách câu hỏi
func GetQuestions(c *gin.Context) {
	var questions []models.Question
	config.DB.Preload("User").Preload("Answers").Order("created_at desc").Find(&questions)
	c.JSON(http.StatusOK, questions)
}

// Lấy chi tiết câu hỏi + các câu trả lời
func GetQuestionDetail(c *gin.Context) {
	id := c.Param("id")
	var question models.Question
	if err := config.DB.Preload("User").Preload("Answers.User").First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy câu hỏi"})
		return
	}
	c.JSON(http.StatusOK, question)
}

// Trả lời câu hỏi
func CreateAnswer(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	var input struct {
		Content    string `json:"content"`
		QuestionID uint   `json:"question_id"`
		Tag        string `json:"tag"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}
	if len(input.Content) > 500 {
		c.JSON(400, gin.H{"error": "Câu trả lời không được vượt quá 500 ký tự!"})
		return
	}
	if len(input.Tag) > 50 {
		c.JSON(400, gin.H{"error": "Thẻ không được vượt quá 50 ký tự!"})
		return
	}
	ans := models.Answer{
		Content:    input.Content,
		QuestionID: input.QuestionID,
		UserID:     user.ID,
		Tag:        input.Tag,
	}
	if err := config.DB.Create(&ans).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo trả lời"})
		return
	}
	// Preload user cho answer vừa tạo
	config.DB.Preload("User").First(&ans, ans.ID)
	c.JSON(http.StatusOK, ans)
}

// Vote up/down cho câu trả lời
func VoteAnswer(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	answerID := c.Param("id")
	var input struct {
		Value int `json:"value"` // 1: up, -1: down
	}
	if err := c.ShouldBindJSON(&input); err != nil || (input.Value != 1 && input.Value != -1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vote không hợp lệ"})
		return
	}
	var vote models.AnswerVote
	err := config.DB.Where("user_id = ? AND answer_id = ?", user.ID, answerID).First(&vote).Error
	if err == nil {
		vote.Value = input.Value
		config.DB.Save(&vote)
	} else {
		aid, _ := strconv.Atoi(answerID)
		vote = models.AnswerVote{UserID: user.ID, AnswerID: uint(aid), Value: input.Value}
		config.DB.Model(&models.AnswerVote{}).Create(&vote)
	}
	// Cập nhật lại tổng vote cho answer
	var answer models.Answer
	if err := config.DB.First(&answer, answerID).Error; err == nil {
		var total int64
		config.DB.Model(&models.AnswerVote{}).Where("answer_id = ?", answerID).Select("SUM(value)").Scan(&total)
		answer.VoteCount = int(total)
		config.DB.Save(&answer)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Đã vote"})
}

// Xoá câu hỏi
func DeleteQuestion(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(401, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	id := c.Param("id")
	var question models.Question
	if err := config.DB.First(&question, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Không tìm thấy câu hỏi"})
		return
	}
	if (user.Role.Name != "admin" && user.Role.Name != "Admin") && question.UserID != user.ID {
		c.JSON(403, gin.H{"error": "Bạn không có quyền xoá câu hỏi này"})
		return
	}
	if err := config.DB.Delete(&question).Error; err != nil {
		c.JSON(500, gin.H{"error": "Không thể xoá câu hỏi"})
		return
	}
	c.JSON(200, gin.H{"message": "Đã xoá câu hỏi"})
}

// Báo cáo câu hỏi
func ReportQuestion(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(401, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	id := c.Param("id")
	var question models.Question
	if err := config.DB.First(&question, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Không tìm thấy câu hỏi"})
		return
	}
	reason := c.PostForm("reason")
	if reason == "" {
		reason = "Người dùng báo cáo câu hỏi này." // Mặc định
	}
	report := models.Report{
		Type:     "question",
		TargetID: question.ID,
		UserID:   user.ID,
		Content:  reason,
	}
	if err := config.DB.Create(&report).Error; err != nil {
		c.JSON(500, gin.H{"error": "Không thể gửi báo cáo"})
		return
	}
	c.JSON(200, gin.H{"message": "Đã gửi báo cáo cho admin!"})
}

// Cập nhật câu hỏi
func UpdateQuestion(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	id := c.Param("id")
	var question models.Question
	if err := config.DB.First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy câu hỏi"})
		return
	}
	if (user.Role.Name != "admin" && user.Role.Name != "Admin") && question.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền sửa câu hỏi này"})
		return
	}
	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Tag     string `json:"tag"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}
	if len(input.Title) > 250 {
		c.JSON(400, gin.H{"error": "Tiêu đề không được vượt quá 250 ký tự!"})
		return
	}
	fmt.Println("Content length:", len(input.Content))
	if len(input.Content) > 2500 {
		c.JSON(400, gin.H{"error": "Câu hỏi không được vượt quá 2500 ký tự!"})
		return
	}
	if len(input.Tag) > 50 {
		c.JSON(400, gin.H{"error": "Thẻ không được vượt quá 50 ký tự!"})
		return
	}
	question.Title = input.Title
	question.Content = input.Content
	question.Tag = input.Tag
	if err := config.DB.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật câu hỏi"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật câu hỏi thành công", "question": question})
}
