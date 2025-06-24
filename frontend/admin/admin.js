
document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || (user.role !== 'admin' && user.role !== 'Admin')) {
        alert('Bạn không có quyền truy cập!');
        window.location.href = '/';
        return;
    }
    document.getElementById('adminName').textContent = user.name;

    document.getElementById('logoutBtn').onclick = () => {
        localStorage.clear();
        location.href = '/';
    };

    //Danh sách người user
    try {
        const userRes = await fetch('http://localhost:8081/users', {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        const users = await userRes.json();
        const userList = document.getElementById('userList');
        userList.innerHTML = Array.isArray(users) && users.length ? users.map(u => `<li>${u.name} (${u.email}) - Vai trò: ${u.role}</li>`).join('') : '<li>Không có người dùng nào.</li>';
    } catch {
        document.getElementById('userList').innerHTML = '<li>Lỗi tải danh sách người dùng.</li>';
    }

    // Danh sách bài viết
    try {
        const postRes = await fetch('http://localhost:8081/posts', {
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
        });
        const posts = await postRes.json();
        const postList = document.getElementById('postList');
        postList.innerHTML = Array.isArray(posts) && posts.length ? posts.map(p => `<li>${p.title} - Tác giả: ${p.user?.name || ''}</li>`).join('') : '<li>Không có bài viết nào.</li>';
    } catch {
        document.getElementById('postList').innerHTML = '<li>Lỗi tải danh sách bài viết.</li>';
    }
}); 