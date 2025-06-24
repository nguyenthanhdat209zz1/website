document.addEventListener('DOMContentLoaded', () => {
    // Hàm rút gọn truy vấn DOM
    function $(selector) { return document.querySelector(selector); }
    function $$(selector) { return document.querySelectorAll(selector); }

    // Lấy thông tin user từ localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Hiển thị thông tin user trên navbar sau khi đăng nhập
    function renderNavbarUser() {
        if (!user || !user.name) return;

        $('#loginBtn').style.display = 'none';

        $('#registerBtn').style.display = 'none';

        $('#userBox').style.display = '';

        $('#avatarBtn').textContent = user.name[0].toUpperCase();

        $('#userName').textContent = user.name;

        $('#popupName').textContent = user.name;

        $('#popupId').textContent = user.id ?? '';

        $('#popupEmail').textContent = user.email ?? '';

        $('#avatarBtn').onclick = e => {
            e.stopPropagation();
            userPopup.style.display = userPopup.style.display === 'block' ? 'none' : 'block';
        };
        userPopup.onclick = e => e.stopPropagation();
        document.addEventListener('click', (e) => {
            $$('.menu-dropdown').forEach(m => m.style.display = 'none');
            if (
                userPopup.style.display === 'block' &&
                !e.target.closest('#userPopup') &&
                !e.target.closest('#avatarBtn')
            ) {
                userPopup.style.display = 'none';
            }
        });
        //đăng xuất
        $('#logoutBtn').onclick = () => {
            localStorage.clear();
            location.reload();
        };
    }

    // Ẩn trang chủ nếu chưa đăng nhập
    if (!user || !user.name) $('#formSection').style.display = 'none';
    else renderNavbarUser();

    // Sự kiện hiển thị nút đăng khi nhập vào ô nội dung
    $('#title').addEventListener('focus', () => $('#submitBtn').style.display = 'inline-block');
    $('#title').addEventListener('blur', () => setTimeout(() => {
        if (!$('#title').value.trim()) $('#submitBtn').style.display = 'none';
    }, 100));
    $('#title').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            $('#postForm').requestSubmit();
        }
    });
    // Xử lý submit form đăng bài hoặc sửa bài
    $('#postForm').addEventListener('submit', async e => {
        e.preventDefault();
        const title = $('#title').value;
        const token = localStorage.getItem('token');
        const editId = $('#postForm').getAttribute('data-edit-id');
        const url = editId ? `http://localhost:8081/posts/${editId}` : 'http://localhost:8081/posts';
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ title })
        });
        const data = await res.json();
        if (res.ok) {
            alert(editId ? 'Sửa thành công!' : 'Đăng bài thành công!');
            $('#postForm').reset();
            $('#postForm').removeAttribute('data-edit-id');
            $('#submitBtn').style.display = 'none';
            $('#title').style.height = '';
            loadPosts();
        } else {
            alert('Lỗi: ' + (data.error || 'Không thể thực hiện!'));
        }
    });

    //tải danh sách bài viết từ backend
    async function loadPosts(posts) {
        if (!posts) {
            const res = await fetch('http://localhost:8081/posts');
            posts = await res.json();
        }
        renderPosts(posts);
    }

    // Hiển thị danh sách bài viết ra giao diện
    function renderPosts(posts) {
        const postsList = $('#postsList');
        postsList.innerHTML = '';
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (!Array.isArray(posts) || posts.length === 0) {
            postsList.innerHTML = '<li class="no-post">Không có bài viết nào.</li>';
            return;
        }
        posts.forEach(post => {
            const postId = post.id ?? post.ID ?? post._id;
            if (!postId) return;
            const author = post.user?.name || post.user?.Name || '';
            const authorFirstChar = author ? author.trim().charAt(0).toUpperCase() : '';
            const isMine = currentUser && post.user && (post.user.id === currentUser.id || post.user.ID === currentUser.id);
            const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'Admin');
            let adminMeta = '';
            if (post.user && post.user.role_id === 1) adminMeta = '<span class="post-admin-meta">meta</span> ';
            const authorNameHtml = adminMeta + author + (isMine ? ' <span class="post-me">· Tôi</span>' : '');
            const li = document.createElement('li');
            li.className = 'post-item';
            li.setAttribute('data-id', postId);
            const menuHtml = isMine || isAdmin
                ? `<button class="edit-btn">Sửa</button><button class="delete-btn">Xoá</button>`
                : `<button class="report-btn">Báo cáo</button>`;
            li.innerHTML = `
                <div class="post-row">
                    <span class="post-author-avatar">${authorFirstChar}</span>
                    <span class="post-author-name">${authorNameHtml}</span>
                </div>
                <div class="post-content"><b>${post.title}</b></div>
                <span class="menu-wrapper">
                    <button class="menu-dot">&#8942;</button>
                    <div class="menu-dropdown">${menuHtml}</div>
                </span>
                <div class="comment-toggle-block">
                    <button class="toggle-comment-btn">
                        Xem bình luận (<span class="comment-count">...</span>)
                    </button>
                </div>
                <div class="comments-block"></div>
                <div class="comment-form"></div>
            `;
            postsList.appendChild(li);
            fetchCommentCount(postId);
            setupToggleComment(postId);

            if (post.user) {
                li.querySelector('.post-author-avatar').onclick = function (e) {
                    e.stopPropagation();
                    showUserInfoPopup(post.user, e, this);
                };
            }
        });
        setupMenuEvents();
    }

    //Hiển thị số lượgn bình luận của 1 bài đăng
    async function fetchCommentCount(postId) {
        const res = await fetch(`http://localhost:8081/comments/${postId}`);
        const comments = await res.json();
        $(`[data-id="${postId}"] .comment-count`).innerText = Array.isArray(comments) ? comments.length : 0;
    }

    // Ẩn/hiện bình luận cho từng bài đăng
    function setupToggleComment(postId) {
        const li = $(`[data-id="${postId}"]`);
        const btn = li.querySelector('.toggle-comment-btn');
        const block = li.querySelector('.comments-block');
        const form = li.querySelector('.comment-form');
        let opened = false;
        btn.onclick = async () => {
            opened = !opened;
            if (opened) {
                await loadComments(postId);
                renderCommentForm(postId);
            }
            block.style.display = opened ? 'block' : 'none';
            form.style.display = opened ? 'flex' : 'none';
            btn.innerHTML = `${opened ? 'Ẩn' : 'Xem'} bình luận (<span class="comment-count">${block.childElementCount}</span>)`;
        };
    }

    //Hiển thị bình luạn của bài viết
    async function loadComments(postId) {
        const res = await fetch(`http://localhost:8081/comments/${postId}`);
        const comments = await res.json();
        const block = $(`[data-id="${postId}"] .comments-block`);

        if (!Array.isArray(comments) || comments.length === 0) {
            block.innerHTML = '<div class="no-comment">Chưa có bình luận nào.</div>';
            return;
        }

        const html = comments
            .slice()
            .reverse()
            .map(c => {
                const name = c.user?.name || 'Ẩn danh';
                const content = c.content;
                return `<div class="comment-item"><b>${name}:</b> <span>${content}</span></div>`;
            })
            .join('');
        block.innerHTML = html;
    }

    // Hiển thị form bình luận dưới mỗi bài viết
    function renderCommentForm(postId) {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const formDiv = $(`[data-id="${postId}"] .comment-form`);
        if (!user?.name) { formDiv.innerHTML = ''; return; }
        formDiv.innerHTML = `<input type="text" class="comment-input" placeholder="Viết bình luận...">
        <button class="comment-btn">Gửi</button>`;
        formDiv.querySelector('.comment-btn').onclick = async function () {
            const content = formDiv.querySelector('.comment-input').value;
            if (!content || !content.trim().length) return alert('Vui lòng nhập nội dung bình luận!');
            const token = localStorage.getItem('token');
            const postIdNum = Number(postId);
            if (!postIdNum) return alert('Không xác định được bài viết!');
            const res = await fetch('http://localhost:8081/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ content: content.trim(), post_id: postIdNum })
            });
            const data = await res.json();
            if (res.ok) {
                formDiv.querySelector('.comment-input').value = '';
                loadComments(postId);
            } else {
                alert(data.error || 'Không gửi được bình luận!');
            }
        };
    }

    // sk menu (sửa, xoá, báo cáo bài viết)
    function setupMenuEvents() {
        $$('.menu-dot').forEach(btn => {
            btn.onclick = e => {
                e.stopPropagation();
                $$('.menu-dropdown').forEach(menu => menu.style.display = 'none');
                btn.nextElementSibling.style.display = 'block';
            }
        });
        $$('.delete-btn').forEach(btn => {
            btn.onclick = async e => {
                e.stopPropagation();
                btn.parentElement.style.display = 'none';
                if (!confirm('Bạn có chắc muốn xoá?')) return;
                const postId = btn.closest('.post-item').dataset.id;
                const res = await fetch(`http://localhost:8081/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
                });
                const data = await res.json();
                alert(res.ok ? 'Đã xoá!' : 'Không xoá được! Lý do: ' + (data.error || ''));
                if (res.ok) loadPosts();
            }
        });
        $$('.edit-btn').forEach(btn => {
            btn.onclick = e => {
                e.stopPropagation();
                btn.parentElement.style.display = 'none';
                const li = btn.closest('li');
                const id = li.dataset.id;
                const oldContent = li.innerHTML;
                li.innerHTML = `
                    <form class="inline-edit-form">
                        <button type="button" class="close-edit">&times;</button>
                        <textarea name="title" required>${li.querySelector('.post-content b').innerText}</textarea>
                        <button type="submit" class="save-edit-btn">Lưu</button>
                    </form>
                `;
                const form = li.querySelector('.inline-edit-form');
                form.onsubmit = async ev => {
                    ev.preventDefault();
                    const newTitle = form.querySelector('textarea[name="title"]').value;
                    const res = await fetch(`http://localhost:8081/posts/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
                        body: JSON.stringify({ title: newTitle })
                    });
                    const data = await res.json();
                    if (res.ok) loadPosts();
                    else { showCustomAlert('Không sửa được! Lý do: ' + (data.error || '')); li.innerHTML = oldContent; }
                };
                form.querySelector('.close-edit').onclick = function () { loadPosts(); };
            }
        });
        $$('.report-btn').forEach(btn => {
            btn.onclick = async e => {
                e.stopPropagation();
                const content = prompt('Nhập nội dung báo cáo bài viết này:');
                if (!content?.trim()) return;
                try {
                    const postId = btn.closest('.post-item').dataset.id;
                    const res = await fetch('http://localhost:8081/reports', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
                        body: JSON.stringify({ postId, content })
                    });
                    alert((await res.json()).error ? 'Không gửi được báo cáo!' : 'Đã gửi báo cáo!');
                } catch { alert('Lỗi khi gửi báo cáo!'); }
            }
        });
    }

    // Tìm kiếm bài viết
    const searchBtn = $('#searchBtn');
    const searchInput = $('#searchInput');
    if (searchBtn && searchInput) {
        searchBtn.onclick = async function () {
            const keyword = searchInput.value.trim();
            if (!keyword) { loadPosts(); return; }
            const res = await fetch(`http://localhost:8081/posts/search?keyword=${encodeURIComponent(keyword)}`);
            const posts = await res.json();
            loadPosts(posts);
        };
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') searchBtn.click();
        });
    }

    //dếm Số kí tự Nội dung thảo luận
    const titleInput = document.getElementById('title');
    const charCount = document.getElementById('charCount');
    if (titleInput && charCount) {
        titleInput.addEventListener('input', function () {
            charCount.textContent = `${this.value.length}/500`;

            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Hiển thị popup thông tin user khi click vào avatar
    function showUserInfoPopup(user, evt, avatarEl) {
        let old = document.getElementById('userInfoPopup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.id = 'userInfoPopup';
        popup.className = 'user-info-popup';
        popup.innerHTML = `
            <div class="user-info-name"><b>Tên:</b> ${user.name ?? user.Name ?? ''}</div>
            <div class="user-info-id"><b>ID:</b> ${user.id ?? user.ID ?? ''}</div>
            <div class="user-info-email"><b>Email:</b> ${user.email ?? ''}</div>
        `;
        document.body.appendChild(popup);
        popup.style.top = (rect.bottom + window.scrollY + 6) + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';
        setTimeout(() => {
            document.addEventListener('mousedown', closePopup, { once: true });
        }, 0);
        function closePopup(e) {
            if (!popup.contains(e.target)) popup.remove();
        }
    }
    loadPosts();
});