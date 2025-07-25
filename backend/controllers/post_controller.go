package controllers

import (
	"backend/config"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// create
func CreatePost(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)

	var input struct {
		Title   string   `json:"title"`
		Content string   `json:"content"`
		Tags    []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Marshal tags sang JSON
	tagsJson, err := json.Marshal(input.Tags)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tags không hợp lệ"})
		return
	}

	post := models.Post{
		Title:   input.Title,
		Content: input.Content,
		Tags:    datatypes.JSON(tagsJson),
		UserID:  user.ID,
	}

	// Nếu là admin thì tự động duyệt
	if user.Role.Name == "admin" || user.Role.Name == "Admin" {
		post.Approved = true
	}

	if err := config.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi tạo bài viết"})
		return
	}
	if err := config.DB.Preload("User").First(&post, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi load thông tin user"})
		return
	}

	// Trả về tags dạng mảng string
	var tagsArr []string
	_ = json.Unmarshal(post.Tags, &tagsArr)

	if user.Role.Name == "admin" || user.Role.Name == "Admin" {
		var users []models.User
		config.DB.Preload("Role").Find(&users)
		var emails []string
		for _, u := range users {
			if u.Role.Name != "admin" && u.Email != "" {
				emails = append(emails, u.Email)
			}
		}
		// Tạo nội dung email theo mẫu
		var postLink = "http://localhost:8081/posts/" + fmt.Sprint(post.ID)
		var authorName = user.Name
		var createdAt = post.CreatedAt.Format("02/01/2006 15:04")
		body := "Chào bạn,<br><br>" +
			"Chúng tôi vừa đăng một bài viết mới trên blog của mình:<br><br>" +
			" Nội dung: " + post.Title + "<br>" +
			" Ngày đăng: " + createdAt + "<br>" +
			" Tác giả: " + authorName + "<br>" +
			" Xem bài viết tại: <a href='" + postLink + "'>" + postLink + "</a><br><br>" +
			"Nội dung bài viết sẽ mang đến cho bạn giá trị/thông tin hữu ích về chủ đề này.<br><br>" +
			"Hãy ghé đọc và chia sẻ cảm nhận nhé!<br><br>" +
			"Trân trọng,<br>Blog: ThanhDatIdea<br>Thông tin liên hệ: anhyeuem2009zz@gmail.com"
		subject := "Có bài viết mới từ admin"
		go utils.SendMail(emails, subject, body)
	}

	fmt.Printf("DEBUG input.Tags: %#v\n", input.Tags)
	c.JSON(http.StatusOK, gin.H{
		"tags_nhan_duoc": input.Tags,
	})
}

// Read
func GetPosts(c *gin.Context) {
	var posts []models.Post
	config.DB.Preload("User").Order("created_at desc").Find(&posts)

	// Map lại để trả về tags là mảng string
	var result []map[string]interface{}
	for _, post := range posts {
		var tagsArr []string
		if len(post.Tags) > 0 {
			_ = json.Unmarshal(post.Tags, &tagsArr)
		}
		// Chuyển post thành map để custom trường tags
		postMap := map[string]interface{}{
			"id":            post.ID,
			"created_at":    post.CreatedAt,
			"updated_at":    post.UpdatedAt,
			"title":         post.Title,
			"content":       post.Content,
			"user_id":       post.UserID,
			"user":          post.User,
			"view_count":    post.ViewCount,
			"like_count":    post.LikeCount,
			"dislike_count": post.DislikeCount,
			"approved":      post.Approved,
			"user_reaction": post.UserReaction,
			"tags":          tagsArr,
		}
		result = append(result, postMap)
	}

	c.JSON(http.StatusOK, result)
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
func GetAllUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Preload("Role").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách user"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// Xóa user
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy user"})
		return
	}

	// Xóa tất cả bài viết của user này
	config.DB.Where("user_id = ?", user.ID).Delete(&models.Post{})
	config.DB.Where("user_id = ?", user.ID).Delete(&models.Comment{})

	// Xóa user
	if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi xóa user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Xóa user thành công"})
}

// Sửa user
func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy user"})
		return
	}
	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}
	user.Name = input.Name
	user.Email = input.Email
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi cập nhật user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật user thành công"})
}

// Update
func UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	var input struct {
		Title   string   `json:"title"`
		Content string   `json:"content"`
		Tags    []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Marshal tags sang JSON
	tagsJson, err := json.Marshal(input.Tags)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tags không hợp lệ"})
		return
	}

	post.Title = input.Title
	post.Content = input.Content
	post.Tags = datatypes.JSON(tagsJson)
	config.DB.Save(&post)

	// Trả về tags dạng mảng string
	var tagsArr []string
	_ = json.Unmarshal(post.Tags, &tagsArr)

	c.JSON(http.StatusOK, gin.H{
		"message": "Cập nhật bài viết thành công",
		"post": gin.H{
			"id":      post.ID,
			"title":   post.Title,
			"content": post.Content,
			"tags":    tagsArr,
			// ... các trường khác nếu muốn ...
		},
	})
}

// Delete
func DeletePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	if err := config.DB.Delete(&post).Error; err != nil {
		c.JSON(500, gin.H{"error": "Lỗi khi xóa bài viết"})
		return
	}
	c.JSON(200, gin.H{"message": "Xóa bài viết thành công"})
}

// Tìm kiếm bài viết theo tiêu đề
func SearchPosts(c *gin.Context) {
	keyword := c.Query("keyword")
	var posts []models.Post
	config.DB.Preload("User").Where("title LIKE ?", "%"+keyword+"%").Order("created_at desc").Find(&posts)
	c.JSON(200, posts)
}

// API tăng lượt xem bài viết
func IncreasePostView(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(401, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	postID := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, postID).Error; err != nil {
		c.JSON(404, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	// Kiểm tra user đã xem bài này chưa
	var pv models.PostView
	if err := config.DB.Where("user_id = ? AND post_id = ?", user.ID, post.ID).First(&pv).Error; err == nil {
		// Đã xem rồi, không tăng nữa
		c.JSON(200, gin.H{"view_count": post.ViewCount, "message": "Đã tính lượt xem trước đó"})
		return
	}
	// Tăng view
	config.DB.Model(&post).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	config.DB.Create(&models.PostView{UserID: user.ID, PostID: post.ID})
	c.JSON(200, gin.H{"view_count": post.ViewCount + 1, "message": "Đã tăng lượt xem"})
}

// API like/dislike bài viết
func HandlePostReaction(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Chưa đăng nhập"})
		return
	}
	user := userInt.(models.User)
	postID := c.Param("id")
	var req struct {
		Reaction string `json:"reaction"` // "like", "dislike", hoặc "none"
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}
	if req.Reaction != "like" && req.Reaction != "dislike" && req.Reaction != "none" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reaction không hợp lệ"})
		return
	}
	var post models.Post
	if err := config.DB.First(&post, postID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	var reaction models.PostReaction
	err := config.DB.Where("user_id = ? AND post_id = ?", user.ID, post.ID).First(&reaction).Error
	prevReaction := "none"
	if err == nil {
		prevReaction = reaction.Reaction
	}
	if req.Reaction == prevReaction {
		c.JSON(http.StatusOK, gin.H{
			"message":       "Không thay đổi",
			"like_count":    post.LikeCount,
			"dislike_count": post.DislikeCount,
			"user_reaction": prevReaction, // Luôn trả về trạng thái hiện tại
		})
		return
	}
	// Cập nhật số lượng like/dislike
	if prevReaction == "like" {
		post.LikeCount--
	}
	if prevReaction == "dislike" {
		post.DislikeCount--
	}
	if req.Reaction == "like" {
		post.LikeCount++
	} else if req.Reaction == "dislike" {
		post.DislikeCount++
	}
	// Lưu lại trạng thái mới
	if req.Reaction == "none" {
		config.DB.Where("user_id = ? AND post_id = ?", user.ID, post.ID).Delete(&models.PostReaction{})
	} else {
		reaction.UserID = user.ID
		reaction.PostID = post.ID
		reaction.Reaction = req.Reaction
		config.DB.Save(&reaction)
	}
	config.DB.Save(&post)
	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật reaction", "like_count": post.LikeCount, "dislike_count": post.DislikeCount})
}

// Lấy danh sách bài viết chờ duyệt (chỉ admin)
func GetPendingPosts(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists || (userInt.(models.User).Role.Name != "admin" && userInt.(models.User).Role.Name != "Admin") {
		c.JSON(403, gin.H{"error": "Chỉ admin mới được xem danh sách này"})
		return
	}
	var posts []models.Post
	// Lấy các bài chưa duyệt, loại trừ bài của admin
	config.DB.Preload("User").Joins("JOIN users ON users.id = posts.user_id").Where("posts.approved = ? AND (users.role_id IS NULL OR users.role_id NOT IN (SELECT id FROM roles WHERE name = 'admin' OR name = 'Admin'))", false).Order("posts.created_at desc").Find(&posts)
	c.JSON(200, posts)
}

// Duyệt bài viết (chỉ admin)
func ApprovePost(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists || (userInt.(models.User).Role.Name != "admin" && userInt.(models.User).Role.Name != "Admin") {
		c.JSON(403, gin.H{"error": "Chỉ admin mới được duyệt bài"})
		return
	}
	id := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	post.Approved = true
	config.DB.Save(&post)
	c.JSON(200, gin.H{"message": "Đã duyệt bài viết"})
}

// Từ chối bài viết (chỉ admin, thực chất là xóa)
func RejectPost(c *gin.Context) {
	userInt, exists := c.Get("user")
	if !exists || (userInt.(models.User).Role.Name != "admin" && userInt.(models.User).Role.Name != "Admin") {
		c.JSON(403, gin.H{"error": "Chỉ admin mới được từ chối bài"})
		return
	}
	id := c.Param("id")
	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Không tìm thấy bài viết"})
		return
	}
	config.DB.Delete(&post)
	c.JSON(200, gin.H{"message": "Đã từ chối (xóa) bài viết"})
}
