const container = document.querySelector(".container"),
    pwShowHide = document.querySelectorAll(".showHidePw"),
    pwFields = document.querySelectorAll(".password"),
    signUp = document.querySelector(".signup-link"),
    login = document.querySelector(".login-link");

// Hàm tiện ích
const showAlert = (message) => alert(message);
const resetForm = (inputs) => inputs.forEach(input => input.value = "");
const getInputValue = (selector) => document.querySelector(selector).value.trim();

// Bật, tắt hiển thị mật khẩu
pwShowHide.forEach(eyeIcon => {
    eyeIcon.addEventListener("click", () => {
        pwFields.forEach(pwField => {
            pwField.type = pwField.type === "password" ? "text" : "password";
            pwShowHide.forEach(icon => {
                icon.classList.toggle("uil-eye-slash");
                icon.classList.toggle("uil-eye");
            });
        });
    });
});

// Chuyển đổi form
signUp.addEventListener("click", () => container.classList.add("active"));
login.addEventListener("click", () => container.classList.remove("active"));

// Xử lý API
const callAPI = async (url, data) => {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error(error);
        throw new Error("Có lỗi xảy ra");
    }
};

//Xử lý đăng ký
document.querySelector(".signup .button input[value='Signup Now']").addEventListener("click", async () => {
    const inputs = {
        name: getInputValue(".signup .input-field:nth-child(1) input"),
        email: getInputValue(".signup .input-field:nth-child(2) input"),
        password: getInputValue(".signup .input-field:nth-child(3) input")
    };

    if (!inputs.name || !inputs.email || !inputs.password) {
        return showAlert("Vui lòng điền đầy đủ thông tin");
    }

    if (!document.getElementById("sigCheck").checked) {
        return showAlert("Vui lòng chấp nhận điều khoản");
    }

    try {
        const result = await callAPI("http://localhost:8081/register", {
            ...inputs,
            role: "user"
        });

        if (result.message) {
            showAlert("Đăng ký thành công");
            resetForm([...document.querySelectorAll(".signup input")]);
            document.getElementById("sigCheck").checked = false;
            container.classList.remove("active");
        } else {
            showAlert(result.error || "Đăng ký không thành công");
        }
    } catch (error) {
        showAlert(error.message);
    }
});

//Xử lý đăng nhập
document.querySelector(".login .button input[value='Login Now']").addEventListener("click", async () => {
    const inputs = {
        email: getInputValue(".login .input-field:nth-child(1) input"),
        password: getInputValue(".login .input-field:nth-child(2) input")
    };

    if (!inputs.email || !inputs.password) {
        return showAlert("Vui lòng điền đầy đủ thông tin");
    }

    try {
        const result = await callAPI("http://localhost:8081/login", inputs);

        if (result.token) {
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));
            showAlert("Đăng nhập thành công");
            window.location.href = "index.html";
        } else {
            showAlert(result.error || "Đăng nhập không thành công");
        }
    } catch (error) {
        showAlert(error.message);
    }
});