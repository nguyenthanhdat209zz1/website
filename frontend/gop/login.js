// Chuyển đổi giữa login/register
document.getElementById('showRegister').onclick = function (e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = '';
};
document.getElementById('showLogin').onclick = function (e) {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = '';
};

// Xử lý submit đăng nhập
document.getElementById('loginForm').onsubmit = async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await fetch('http://localhost:8081/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = "index.html";
        } else {
            alert(data.error || "Đăng nhập thất bại!");
        }
    } catch (err) {
        alert("Không kết nối được server!");
        console.error(err);
    }
};

// Xử lý submit đăng ký
document.getElementById('registerForm').onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    if (!name || !email || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }
    try {
        const res = await fetch('http://localhost:8081/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role: "user" })
        });
        const data = await res.json();
        if (res.ok && data.message) {
            alert("Đăng ký thành công! Bạn có thể đăng nhập.");
            document.getElementById('registerForm').reset();
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = '';
        } else {
            alert(data.error || "Đăng ký không thành công!");
        }
    } catch (err) {
        alert("Không kết nối được server!");
        console.error(err);
    }
};