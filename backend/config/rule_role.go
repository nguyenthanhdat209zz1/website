package config

import (
	"backend/models"

	"gorm.io/gorm"
)

func Rule_Role(db *gorm.DB) {
	create := models.Rule{Name: "create_post"}
	edit := models.Rule{Name: "edit_post"}
	delete := models.Rule{Name: "delete_post"}

	db.FirstOrCreate(&create, create)
	db.FirstOrCreate(&edit, edit)
	db.FirstOrCreate(&delete, delete)

	admin := models.Role{Name: "admin"}
	user := models.Role{Name: "user"}
	guest := models.Role{Name: "viewer"}

	db.FirstOrCreate(&admin, admin)
	db.FirstOrCreate(&user, user)
	db.FirstOrCreate(&guest, guest)

	db.Model(&admin).Association("Rules").Replace([]models.Rule{create, edit, delete})
	db.Model(&user).Association("Rules").Replace([]models.Rule{create, edit, delete})
	db.Model(&guest).Association("Rules").Clear()

}
