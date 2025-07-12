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

    // ẨN FORM ĐĂNG BÀI NẾU CHƯA ĐĂNG NHẬP
    if (!user || !user.name) $('#formSection').style.display = 'none';
    else renderNavbarUser();

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

    // XỬ LÝ SUBMIT FORM ĐĂNG/SỬA BÀI
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
            alert(editId ? 'Sửa thành công!' : (data.message || 'Đăng bài thành công!'));
            $('#postForm').reset();
            $('#postForm').removeAttribute('data-edit-id');
            $('#submitBtn').style.display = 'none';
            $('#title').style.height = '';
            loadPosts();
        } else {
            alert('Lỗi: ' + (data.error || 'Không thể thực hiện!'));
        }
    });

    // TẢI DANH SÁCH BÀI VIẾT TỪ BACKEND
    async function loadPosts(posts) {
        if (!posts) {
            const res = await fetch('http://localhost:8081/posts');
            posts = await res.json();
        }
        renderPosts(posts);
        // CUỘN ĐẾN BÀI ĐƯỢC GẮN ANCHOR
        const hash = window.location.hash;
        if (hash && hash.startsWith('#post-')) {
            const postId = hash.replace('#post-', '');
            const el = document.querySelector(`[data-id=\"${postId}\"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.boxShadow = '0 0 0 3px #4070f4, 0 2px 8px rgba(0,0,0,0.07)';
                el.style.transition = 'box-shadow 0.5s';
                setTimeout(() => { el.style.boxShadow = ''; }, 2000);
            }
        }
    }

    // HIỂN THỊ DANH SÁCH BÀI VIẾT RA GIAO DIỆN
    function renderPosts(posts) {
        const postsList = $('#postsList');
        postsList.innerHTML = '';
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'Admin');
        if (!isAdmin) {
            posts = posts.filter(post => post.approved === true || post.Approved === true);
        }
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
            // Xử lý ngày giờ đăng
            let createdAt = post.created_at || post.CreatedAt || post.createdAt;
            let dateStr = '';
            if (createdAt) {
                let d = new Date(createdAt);
                let h = d.getHours().toString().padStart(2, '0');
                let m = d.getMinutes().toString().padStart(2, '0');
                let day = d.getDate().toString().padStart(2, '0');
                let month = (d.getMonth() + 1).toString().padStart(2, '0');
                let year = d.getFullYear();
                dateStr = ` <span class='post-date'>${h}:${m} ${day}/${month}/${year}</span>`;
            }
            const authorNameHtml = adminMeta + author + (isMine ? ' <span class="post-me">· Tôi</span>' : '') + dateStr;
            const li = document.createElement('li');
            li.className = 'post-item';
            li.setAttribute('data-id', postId);
            const menuHtml = isMine || isAdmin
                ? `<button class="edit-btn">Sửa</button><button class="delete-btn">Xoá</button>`
                : `<button class="report-btn">Báo cáo</button>`;
            // Xử lý nội dung rút gọn
            let fullContent = post.title;
            let shortContent = fullContent.length > 350 ? fullContent.slice(0, 350) + '...' : fullContent;
            let showReadMore = fullContent.length > 350;
            li.innerHTML = `
                <div class="post-row">
                    <span class="post-author-avatar">${authorFirstChar}</span>
                    <span class="post-author-name">${authorNameHtml}</span>
                </div>
                <div class="post-content"><b>${shortContent}</b></div>
                ${showReadMore ? '<button class="read-more-btn">Đọc thêm</button>' : ''}
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
                <div class="post-view-row">
                    <span class="post-view-count">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" fill="none" stroke="#888"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="#888"/>
                        </svg>
                        <span>${post.view_count ?? 0}</span>
                    </span>
                </div>
                <div class="post-reaction-row">
                    <button class="like-btn" title="Thích">
                        <i class="bx bx-like"></i>
                        <span class="like-count">${post.like_count ?? 0}</span>
                    </button>
                    <button class="dislike-btn" title="Không thích">
                        <i class="bx bx-dislike"></i>
                        <span class="dislike-count">${post.dislike_count ?? 0}</span>
                    </button>
                </div>
            `;
            postsList.appendChild(li);
            // Xử lý nút đọc thêm/thu gọn
            if (showReadMore) {
                const readMoreBtn = li.querySelector('.read-more-btn');
                const postContent = li.querySelector('.post-content b');
                let expanded = false;
                readMoreBtn.onclick = function () {
                    expanded = !expanded;
                    if (expanded) {
                        postContent.textContent = fullContent;
                        readMoreBtn.textContent = 'Thu gọn';
                    } else {
                        postContent.textContent = shortContent;
                        readMoreBtn.textContent = 'Đọc thêm';
                    }
                };
            }
            fetchCommentCount(postId);
            setupToggleComment(postId);

            // Xử lý like/dislike
            const likeBtn = li.querySelector('.like-btn');
            const dislikeBtn = li.querySelector('.dislike-btn');
            likeBtn.onclick = async function () {
                await handleReaction(postId, 'like', li);
            };
            dislikeBtn.onclick = async function () {
                await handleReaction(postId, 'dislike', li);
            };

            if (post.user) {
                li.querySelector('.post-author-avatar').onclick = function (e) {
                    e.stopPropagation();
                    showUserInfoPopup(post.user, e, this);
                };
            }
        });
        setupMenuEvents();
    }

    // HIỂN THỊ SỐ LƯỢNG BÌNH LUẬN
    async function fetchCommentCount(postId) {
        const res = await fetch(`http://localhost:8081/comments/${postId}`);
        const comments = await res.json();
        $(`[data-id="${postId}"] .comment-count`).innerText = Array.isArray(comments) ? comments.length : 0;
    }

    // ẨN/HIỆN BÌNH LUẬN CHO TỪNG BÀI
    function setupToggleComment(postId) {
        const li = $(`[data-id="${postId}"]`);
        const btn = li.querySelector('.toggle-comment-btn');
        const block = li.querySelector('.comments-block');
        const form = li.querySelector('.comment-form');
        let opened = false;
        btn.onclick = async () => {
            opened = !opened;
            if (opened) {
                // Gọi API tăng view nếu user đã đăng nhập
                const token = localStorage.getItem('token');
                if (token) {
                    fetch(`http://localhost:8081/posts/${postId}/view`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }
                await loadComments(postId);
                renderCommentForm(postId);
            }
            block.style.display = opened ? 'block' : 'none';
            form.style.display = opened ? 'flex' : 'none';
            btn.innerHTML = `${opened ? 'Ẩn' : 'Xem'} bình luận (<span class="comment-count">${block.childElementCount}</span>)`;
        };
    }

    // HIỂN THỊ DANH SÁCH BÌNH LUẬN
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

    // HIỂN THỊ FORM BÌNH LUẬN DƯỚI MỖI BÀI
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

    // XỬ LÝ LIKE/DISLIKE
    async function handleReaction(postId, type, li) {
        const token = localStorage.getItem('token');
        if (!token) return alert('Bạn cần đăng nhập để thực hiện!');
        const likeBtn = li.querySelector('.like-btn');
        const dislikeBtn = li.querySelector('.dislike-btn');
        let current = '';
        if (likeBtn.classList.contains('active')) current = 'like';
        if (dislikeBtn.classList.contains('active')) current = 'dislike';
        let reaction = type;
        if (current === type) reaction = 'none'; // Bấm lại để bỏ chọn
        const res = await fetch(`http://localhost:8081/posts/${postId}/reaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ reaction })
        });
        const data = await res.json();
        if (res.ok) {
            likeBtn.querySelector('.like-count').innerText = data.like_count;
            dislikeBtn.querySelector('.dislike-count').innerText = data.dislike_count;
            likeBtn.classList.toggle('active', reaction === 'like');
            dislikeBtn.classList.toggle('active', reaction === 'dislike');
        } else {
            alert(data.error || 'Có lỗi xảy ra!');
        }
    }

    // MENU SỬA/XÓA/BÁO CÁO BÀI VIẾT
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
                        body: JSON.stringify({
                            type: 'post',
                            target_id: Number(postId),
                            content
                        })
                    });
                    alert((await res.json()).error ? 'Không gửi được báo cáo!' : 'Đã gửi báo cáo!');
                } catch { alert('Lỗi khi gửi báo cáo!'); }
            }
        });
    }

    // TÌM KIẾM BÀI VIẾT
    const searchBtn = $('#searchBtn');
    const searchInput = $('#searchInput');
    const authorInput = $('#authorInput');
    if (searchBtn && searchInput && authorInput) {
        searchBtn.onclick = async function () {
            const keyword = searchInput.value.trim().toLowerCase();
            const authorKeyword = authorInput.value.trim().toLowerCase();
            let res = await fetch('http://localhost:8081/posts');
            let posts = await res.json();
            // Lọc theo tiêu đề
            if (keyword) {
                posts = posts.filter(p => (p.title || '').toLowerCase().includes(keyword));
            }
            // Lọc theo người đăng
            if (authorKeyword) {
                posts = posts.filter(p => {
                    let name = (p.user?.name || p.user?.Name || '').toLowerCase();
                    return name.includes(authorKeyword);
                });
            }
            loadPosts(posts);
        };
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') searchBtn.click();
        });
        authorInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') searchBtn.click();
        });
    }

    // ĐẾM SỐ KÝ TỰ NỘI DUNG THẢO LUẬN
    const titleInput = document.getElementById('title');
    const charCount = document.getElementById('charCount');
    if (titleInput && charCount) {
        titleInput.addEventListener('input', function () {
            charCount.textContent = `${this.value.length}/1500`;

            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // HIỂN THỊ POPUP THÔNG TIN USER KHI CLICK AVATAR
    function showUserInfoPopup(user, evt, avatarEl) {
        let old = document.getElementById('userInfoPopup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.id = 'userInfoPopup';
        popup.className = 'user-info-popup';
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const isMe = currentUser && (user.id ?? user.ID) === currentUser.id;
        if (isMe) {
            // Chỉ hiện nút Trang cá nhân
            popup.innerHTML = `<div id="profileBtnWrap"></div>`;
        } else {
            popup.innerHTML = `
                <div class="user-info-name"><b>Tên:</b> ${user.name ?? user.Name ?? ''}</div>
                <div class="user-info-id"><b>ID:</b> ${user.id ?? user.ID ?? ''}</div>
                <div class="user-info-email"><b>Email:</b> ${user.email ?? ''}</div>
                <div id="profileBtnWrap"></div>
            `;
        }
        document.body.appendChild(popup);
        // Định vị popup ngay dưới cạnh avatarEl
        const rect = avatarEl.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';
        setTimeout(() => {
            document.addEventListener('mousedown', closePopup, { once: true });
        }, 0);
        function closePopup(e) {
            if (!popup.contains(e.target)) popup.remove();
        }
        // Luôn hiện nút Trang cá nhân
        const btn = document.createElement('button');
        btn.textContent = 'Trang cá nhân';
        btn.style = 'margin-top:10px;background:#4070f4;color:#fff;border:none;border-radius:8px;padding:7px 18px;cursor:pointer;font-size:15px;';
        btn.onclick = function () {
            // Lọc bài viết chỉ của user này
            fetch('http://localhost:8081/posts').then(r => r.json()).then(posts => {
                posts = posts.filter(p => (p.user?.id || p.user?.ID) === (user.id ?? user.ID));
                loadPosts(posts);
                popup.remove();
            });
        };
        popup.querySelector('#profileBtnWrap').appendChild(btn);
    }

    // CHUYỂN GIAO DIỆN ADMIN
    const btn = document.getElementById('switch-to-admin');
    console.log('USER:', user);
    console.log('BTN:', btn);
    if (user && (user.role === 'admin' || user.role === 'Admin') && btn) {
        btn.style.display = 'inline-block';
        btn.onclick = function () {
            localStorage.setItem('currentView', 'admin');
            window.location.href = '../admin/admin.html';
        };
    } else if (btn) {
        btn.style.display = 'none';
    }

    // LOAD BÀI VIẾT LẦN ĐẦU
    loadPosts();
});