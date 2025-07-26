document.addEventListener('DOMContentLoaded', async () => {
    // KIỂM TRA QUYỀN ADMIN
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || (user.role !== 'admin' && user.role !== 'Admin')) {
        alert('Bạn không có quyền truy cập!');
        window.location.href = '/';
        return;
    }
    document.getElementById('adminName').textContent = user.name;

    // ĐĂNG XUẤT
    document.getElementById('logoutBtn').onclick = () => {
        localStorage.clear();
        location.href = '/';
    };

    // CHUYỂN TAB
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        };
    });

    // ĐỔI GIAO DIỆN SÁNG/TỐI
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    if (toggleThemeBtn) {
        toggleThemeBtn.onclick = () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('adminTheme', document.body.classList.contains('dark') ? 'dark' : 'light');
        };
        // Tự động load theme đã chọn
        if (localStorage.getItem('adminTheme') === 'dark') {
            document.body.classList.add('dark');
        }
    }

    // LOAD DANH SÁCH NGƯỜI DÙNG
    async function loadUsers() {
        try {
            const API_URL = 'https://website-datz.onrender.com';
            const userRes = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            const users = await userRes.json();
            const userList = document.getElementById('userList');
            userList.innerHTML = Array.isArray(users) && users.length ? users.map(u => {
                // Hiển thị từng user
                const roleName = u.role?.name || u.role?.Name || (typeof u.role === 'string' ? u.role : '') || 'Không rõ';
                return `
                    <li>
                        <b>${u.name}</b> (${u.email}) - Role: ${roleName}
                        <span class="user-actions">
                            <button class="user-menu-dot">&#8942;</button>
                            <div class="user-menu-dropdown">
                                <button class="edit-user-btn" data-id="${u.id}" data-name="${u.name}" data-email="${u.email}">Sửa</button>
                                <button class="delete-user-btn" data-id="${u.id}">Xóa</button>
                            </div>
                        </span>
                    </li>
                `;
            }).join('') : '<li>Không có người dùng nào.</li>';

            // HIỆN/ẨN MENU BA CHẤM NGƯỜI DÙNG
            document.querySelectorAll('.user-menu-dot').forEach(dot => {
                dot.onclick = function (e) {
                    e.stopPropagation();
                    document.querySelectorAll('.user-menu-dropdown').forEach(menu => menu.style.display = 'none');
                    this.nextElementSibling.style.display = 'block';
                };
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-menu-dropdown') && !e.target.classList.contains('user-menu-dot')) {
                    document.querySelectorAll('.user-menu-dropdown').forEach(menu => menu.style.display = 'none');
                }
            });

            // XỬ LÝ SỬA/XÓA USER
            document.getElementById('userList').onclick = function (e) {
                if (e.target.classList.contains('edit-user-btn')) {
                    e.stopPropagation();
                    const btn = e.target;
                    const id = btn.getAttribute('data-id');
                    const oldName = btn.getAttribute('data-name');
                    const oldEmail = btn.getAttribute('data-email');
                    showEditUserPopup(id, oldName, oldEmail, btn);
                }
                if (e.target.classList.contains('delete-user-btn')) {
                    e.stopPropagation();
                    const btn = e.target;
                    const id = btn.getAttribute('data-id');
                    if (!confirm('Bạn có chắc muốn xóa user này?')) return;
                    fetch(`https://website-datz.onrender.com/users/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                    }).then(res => {
                        if (res.ok) {
                            alert('Đã xóa user!');
                            loadUsers();
                        } else {
                            alert('Xóa user thất bại!');
                        }
                    });
                }
            };
        } catch {
            document.getElementById('userList').innerHTML = '<li>Lỗi tải danh sách người dùng.</li>';
        }
    }

    // POPUP SỬA USER
    function showEditUserPopup(id, oldName, oldEmail, btnEl) {
        let oldPopup = document.querySelector('.edit-user-popup');
        if (oldPopup) oldPopup.remove();
        let popup = document.createElement('div');
        popup.className = 'edit-user-popup';
        popup.innerHTML = `
            <h3>Sửa thông tin user</h3>
            <form id="editUserForm">
                <label>Tên:<br><input type="text" name="name" value="${oldName}" required></label><br>
                <label>Email:<br><input type="email" name="email" value="${oldEmail}" required></label><br>
                <div>
                    <button type="button" id="cancelEditUser">Hủy</button>
                    <button type="submit">Lưu</button>
                </div>
            </form>
        `;
        document.body.appendChild(popup);
        // Định vị popup thông minh: phải, nếu tràn thì trái, nếu vẫn tràn thì sát mép phải
        if (btnEl) {
            const rect = btnEl.getBoundingClientRect();
            setTimeout(() => {
                popup.style.position = 'absolute';
                let left = rect.right + window.scrollX + 8;
                let top = rect.top + window.scrollY;
                popup.style.left = left + 'px';
                popup.style.top = top + 'px';
                popup.style.zIndex = 2100;
                // Nếu tràn phải thì chuyển sang trái
                const popupRect = popup.getBoundingClientRect();
                if (popupRect.right > window.innerWidth) {
                    left = rect.left + window.scrollX - popup.offsetWidth - 8;
                    popup.style.left = left + 'px';
                }
                // Nếu vẫn tràn trái thì căn sát mép phải
                if (popup.getBoundingClientRect().left < 0) {
                    popup.style.left = (window.innerWidth - popup.offsetWidth - 8) + 'px';
                }
            }, 0);
        }
        // Đóng popup khi click ra ngoài
        setTimeout(() => {
            function handleClickOutside(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('mousedown', handleClickOutside);
                }
            }
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        document.getElementById('cancelEditUser').onclick = () => popup.remove();
        document.getElementById('editUserForm').onsubmit = async function (ev) {
            ev.preventDefault();
            const name = this.name.value.trim();
            const email = this.email.value.trim();
            const res = await fetch(`https://website-datz.onrender.com/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
                body: JSON.stringify({ name, email })
            });
            if (res.ok) {
                alert('Đã cập nhật user!');
                popup.remove();
                loadUsers();
            } else {
                alert('Cập nhật thất bại!');
            }
        };
    }

    // LOAD DANH SÁCH BÀI VIẾT
    async function loadPosts() {
        try {
            const API_URL = 'https://website-datz.onrender.com';
            const postRes = await fetch(`${API_URL}/posts`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            const posts = await postRes.json();
            const postList = document.getElementById('postList');
            postList.innerHTML = Array.isArray(posts) && posts.length ? posts.map(p => {
                const author = p.user?.name || p.user?.Name || '';
                return `
                    <li>
                        <b>${p.title}</b> - Tác giả: ${author}
                        <span class="post-actions">
                            <button class="post-menu-dot">&#8942;</button>
                            <div class="post-menu-dropdown">
                                <button class="edit-post-btn" data-id="${p.id || p.ID || p._id}" data-title="${p.title}" data-content="${p.content || ''}">Sửa</button>
                                <button class="delete-post-btn" data-id="${p.id || p.ID || p._id}">Xóa</button>
                            </div>
                        </span>
                    </li>
                `;
            }).join('') : '<li>Không có bài viết nào.</li>';

            // HIỆN/ẨN MENU BA CHẤM CHO BÀI VIẾT
            document.querySelectorAll('.post-menu-dot').forEach(dot => {
                dot.onclick = function (e) {
                    e.stopPropagation();
                    document.querySelectorAll('.post-menu-dropdown').forEach(menu => menu.style.display = 'none');
                    this.nextElementSibling.style.display = 'block';
                };
            });
            document.addEventListener('click', () => {
                document.querySelectorAll('.post-menu-dropdown').forEach(menu => menu.style.display = 'none');
            });

            // SỬA BÀI VIẾT
            document.querySelectorAll('.edit-post-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    const oldTitle = btn.getAttribute('data-title');
                    const oldContent = btn.getAttribute('data-content');
                    showEditPostPopup(id, oldTitle, oldContent, btn);
                };
            });
            // XÓA BÀI VIẾT
            document.querySelectorAll('.delete-post-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
                    const res = await fetch(`https://website-datz.onrender.com/posts/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                    });
                    if (res.ok) {
                        alert('Đã xóa bài viết!');
                        loadPosts();
                    } else {
                        alert('Xóa bài viết thất bại!');
                    }
                };
            });
        } catch {
            document.getElementById('postList').innerHTML = '<li>Lỗi tải danh sách bài viết.</li>';
        }
    }

    // LOAD DANH SÁCH BÌNH LUẬN
    async function loadComments() {
        try {
            const API_URL = 'https://website-datz.onrender.com';
            const commentRes = await fetch(`${API_URL}/comments`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            const comments = await commentRes.json();
            const commentList = document.getElementById('commentList');
            commentList.innerHTML = Array.isArray(comments) && comments.length ? comments.map(c => {
                const author = c.user?.name || c.user?.Name || 'Ẩn danh';
                const postTitle = c.post?.title || c.postTitle || '';
                return `
                    <li>
                        <div>
                            <b>${author}</b>
                            <span class="comment-meta">${postTitle ? `- Bài: <i>${postTitle}</i>` : ''}</span>
                        </div>
                        <div style="margin:6px 0 0 0;">${c.content}</div>
                        <span class="comment-actions">
                            <button class="comment-menu-dot">&#8942;</button>
                            <div class="comment-menu-dropdown">
                                <button class="delete-comment-btn" data-id="${c.id || c.ID || c._id}">Xóa</button>
                            </div>
                        </span>
                    </li>
                `;
            }).join('') : '<li>Không có bình luận nào.</li>';

            // HIỆN/ẨN MENU BA CHẤM CHO BÌNH LUẬN
            document.querySelectorAll('.comment-menu-dot').forEach(dot => {
                dot.onclick = function (e) {
                    e.stopPropagation();
                    document.querySelectorAll('.comment-menu-dropdown').forEach(menu => menu.style.display = 'none');
                    this.nextElementSibling.style.display = 'block';
                };
            });
            document.addEventListener('click', () => {
                document.querySelectorAll('.comment-menu-dropdown').forEach(menu => menu.style.display = 'none');
            });

            // XÓA BÌNH LUẬN
            document.querySelectorAll('.delete-comment-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
                    const res = await fetch(`https://website-datz.onrender.com/comments/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                    });
                    if (res.ok) {
                        alert('Đã xóa bình luận!');
                        loadComments();
                    } else {
                        alert('Xóa bình luận thất bại!');
                    }
                };
            });
        } catch {
            document.getElementById('commentList').innerHTML = '<li>Lỗi tải danh sách bình luận.</li>';
        }
    }

    // LOAD DANH SÁCH BÁO CÁO
    async function loadReports() {
        try {
            const API_URL = 'https://website-datz.onrender.com';
            const res = await fetch(`${API_URL}/reports`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            const reports = await res.json();
            const reportList = document.getElementById('reportList');
            reportList.innerHTML = Array.isArray(reports) && reports.length ? reports.map(r => {
                const userName = r.user?.name || r.user?.Name || 'Ẩn danh';
                const typeLabel = r.type === 'post' ? 'Bài viết' : 'Bình luận';
                let viewBtn = '';
                if (r.type === 'post') {
                    viewBtn = `<a href="../gop/index.html#post-${r.target_id}" target="_blank" style="margin-left:12px;color:#4070f4;font-weight:500;text-decoration:underline;">Xem bài viết</a>`;
                }
                return `
                    <li style="margin-bottom:16px; background:#fff; border-radius:8px; box-shadow:0 1px 4px #0001; padding:16px 18px;">
                        <div><b>Loại:</b> ${typeLabel}</div>
                        <div><b>ID Bài viết:</b> ${r.target_id} ${viewBtn}</div>
                        <div><b>Người báo cáo:</b> ${userName}</div>
                        <div><b>Nội dung báo cáo:</b> <span style="color:#d00">${r.content}</span></div>
                        <div style="font-size:12px;color:#888;">Thời gian: ${new Date(r.created_at).toLocaleString()}</div>
                    </li>
                `;
            }).join('') : '<li>Không có báo cáo nào.</li>';
        } catch {
            document.getElementById('reportList').innerHTML = '<li>Lỗi tải danh sách báo cáo.</li>';
        }
    }

    // LOAD DANH SÁCH BÀI CHỜ DUYỆT
    async function loadPendingPosts() {
        try {
            const API_URL = 'https://website-datz.onrender.com';
            const res = await fetch(`${API_URL}/posts/pending`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            const posts = await res.json();
            const pendingList = document.getElementById('pendingPostList');
            pendingList.innerHTML = Array.isArray(posts) && posts.length ? posts.map(p => {
                const author = p.user?.name || p.user?.Name || '';
                return `
                    <li>
                        <b>${p.title}</b> <span class="author">Tác giả: ${author}</span>
                        <span class="pending-label">Chờ duyệt</span>
                        <span class="pending-actions">
                            <button class="approve-post-btn" data-id="${p.id || p.ID || p._id}">Duyệt</button>
                            <button class="reject-post-btn" data-id="${p.id || p.ID || p._id}">Từ chối</button>
                        </span>
                    </li>
                `;
            }).join('') : '<li>Không có bài viết chờ duyệt.</li>';

            // XỬ LÝ DUYỆT BÀI
            document.querySelectorAll('.approve-post-btn').forEach(btn => {
                btn.onclick = async function () {
                    const id = btn.getAttribute('data-id');
                    const res = await fetch(`${API_URL}/posts/${id}/approve`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                    });
                    if (res.ok) {
                        alert('Đã duyệt bài viết!');
                        loadPendingPosts();
                    } else {
                        alert('Duyệt bài thất bại!');
                    }
                };
            });
            // XỬ LÝ TỪ CHỐI BÀI
            document.querySelectorAll('.reject-post-btn').forEach(btn => {
                btn.onclick = async function () {
                    const id = btn.getAttribute('data-id');
                    if (!confirm('Bạn có chắc muốn từ chối (xóa) bài viết này?')) return;
                    const res = await fetch(`${API_URL}/posts/${id}/reject`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                    });
                    if (res.ok) {
                        alert('Đã từ chối (xóa) bài viết!');
                        loadPendingPosts();
                    } else {
                        alert('Từ chối bài thất bại!');
                    }
                };
            });
        } catch {
            document.getElementById('pendingPostList').innerHTML = '<li>Lỗi tải danh sách bài chờ duyệt.</li>';
        }
    }

    // ĐỔI GIAO DIỆN NGƯỜI DÙNG
    document.getElementById('switch-to-user').onclick = function () {
        localStorage.setItem('currentView', 'user');
        window.location.href = '../gop/index.html';
    };

    // Gọi loadUsers khi vào tab user
    async function onTabUser() { await loadUsers(); }
    // Gọi khi load trang hoặc chuyển tab user
    onTabUser();
    document.querySelector('[data-tab="userTab"]').addEventListener('click', onTabUser);

    // Gọi loadPosts khi vào tab post
    async function onTabPost() { await loadPosts(); }
    document.querySelector('[data-tab="postTab"]').addEventListener('click', onTabPost);
    // Gọi khi load trang hoặc chuyển tab post
    onTabPost();

    // Gọi loadComments khi vào tab comment
    async function onTabComment() { await loadComments(); }
    document.querySelector('[data-tab="commentTab"]').addEventListener('click', onTabComment);

    // Thống kê

    // Hàm popup sửa bài viết
    function showEditPostPopup(id, oldTitle, oldContent, btnEl) {
        let oldPopup = document.querySelector('.edit-post-popup');
        if (oldPopup) oldPopup.remove();
        let popup = document.createElement('div');
        popup.className = 'edit-post-popup';
        popup.innerHTML = `
            <h3>Sửa bài viết</h3>
            <form id="editPostForm" class="form-vertical">
                <label>Nội dung:
                    <input type="text" name="title" value="${oldTitle}" required>
                </label>
                <div class="edit-post-popup-btns">
                    <button type="button" id="cancelEditPost">Hủy</button>
                    <button type="submit">Lưu</button>
                </div>
            </form>
        `;
        document.body.appendChild(popup);
        // Định vị popup thông minh: phải, nếu tràn thì trái, nếu vẫn tràn thì sát mép phải
        if (btnEl) {
            const rect = btnEl.getBoundingClientRect();
            setTimeout(() => {
                popup.style.position = 'absolute';
                let left = rect.right + window.scrollX + 8;
                let top = rect.top + window.scrollY;
                popup.style.left = left + 'px';
                popup.style.top = top + 'px';
                popup.style.zIndex = 2100;
                // Nếu tràn phải thì chuyển sang trái
                const popupRect = popup.getBoundingClientRect();
                if (popupRect.right > window.innerWidth) {
                    left = rect.left + window.scrollX - popup.offsetWidth - 8;
                    popup.style.left = left + 'px';
                }
                // Nếu vẫn tràn trái thì căn sát mép phải
                if (popup.getBoundingClientRect().left < 0) {
                    popup.style.left = (window.innerWidth - popup.offsetWidth - 8) + 'px';
                }
            }, 0);
        }
        // Đóng popup khi click ra ngoài
        setTimeout(() => {
            function handleClickOutside(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('mousedown', handleClickOutside);
                }
            }
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        document.getElementById('cancelEditPost').onclick = () => popup.remove();
        document.getElementById('editPostForm').onsubmit = async function (ev) {
            ev.preventDefault();
            const title = this.title.value.trim();
            const res = await fetch(`https://website-datz.onrender.com/posts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                alert('Đã cập nhật bài viết!');
                popup.remove();
                loadPosts();
            } else {
                alert('Cập nhật thất bại!');
            }
        };
    }

    async function loadStats() {
        try {
            const API_URL = 'https://website-datz.onrender.com';
            const res = await fetch(`${API_URL}/stats`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
            });
            const stats = await res.json();
            document.getElementById('statsContent').innerHTML = `
                <div class="stat-grid">
                    <div><b>Tổng user:</b> ${stats.userCount}</div>
                    <div><b>Tổng bài viết:</b> ${stats.postCount}</div>
                    <div><b>Tổng bình luận:</b> ${stats.commentCount}</div>
                    <div><b>User mới 7 ngày:</b> ${stats.userNew}</div>
                    <div><b>Bài viết mới 7 ngày:</b> ${stats.postNew}</div>
                    <div><b>Bình luận mới 7 ngày:</b> ${stats.commentNew}</div>
                </div>
            `;
        } catch {
            document.getElementById('statsContent').innerHTML = '<div>Lỗi tải thống kê.</div>';
        }
    }
    document.querySelector('[data-tab="statsTab"]').addEventListener('click', loadStats);

    // Gọi loadReports khi vào tab báo cáo
    async function onTabReport() { await loadReports(); }
    document.querySelector('[data-tab="reportTab"]').addEventListener('click', onTabReport);

    // Gọi khi vào tab bài viết chờ duyệt
    async function onTabPendingPost() { await loadPendingPosts(); }
    document.querySelector('[data-tab="pendingPostTab"]').addEventListener('click', onTabPendingPost);
}); 