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
    if (!user || !user.name) {
        $('#formSection').style.display = 'none';
        const switchAdminBtn = document.getElementById('switch-to-admin');
        if (switchAdminBtn) switchAdminBtn.style.display = 'none';

        const userBox = document.getElementById('userBox');
        if (userBox) userBox.style.display = 'none';
    } else {
        renderNavbarUser();
        const switchAdminBtn = document.getElementById('switch-to-admin');
        if (switchAdminBtn) {
            if (user.role === 'admin' || user.role === 'Admin') {
                switchAdminBtn.style.display = '';
            } else {
                switchAdminBtn.style.display = 'none';
            }
        }
        const userBox = document.getElementById('userBox');
        if (userBox) userBox.style.display = '';
    }

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
        // Không cần lấy tags nữa, chỉ gửi nội dung
        const token = localStorage.getItem('token');
        const editId = $('#postForm').getAttribute('data-edit-id');
        const API_URL = 'https://website-datz.onrender.com';
        const url = editId ? `${API_URL}/posts/${editId}` : `${API_URL}/posts`;
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
            const res = await fetch('https://website-datz.onrender.com/posts');
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
            let updatedAt = post.updated_at || post.UpdatedAt || post.updatedAt;
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

            // Kiểm tra nếu đã chỉnh sửa
            let editedStr = '';
            if (updatedAt && createdAt && updatedAt !== createdAt) {
                let d = new Date(updatedAt);
                let h = d.getHours().toString().padStart(2, '0');
                let m = d.getMinutes().toString().padStart(2, '0');
                let day = d.getDate().toString().padStart(2, '0');
                let month = (d.getMonth() + 1).toString().padStart(2, '0');
                let year = d.getFullYear();
                editedStr = `<span class="post-edited">(đã chỉnh sửa)</span>`;
            }

            const authorNameHtml = adminMeta + author + (isMine ? ' <span class="post-me">· Tôi</span>' : '') + dateStr + editedStr;
            const li = document.createElement('li');
            li.className = 'post-item';
            li.setAttribute('data-id', postId);
            let menuHtml = `<button class="menu-dot">&#8942;</button><div class="menu-dropdown" style="display:none;position:absolute;
            z-index:10;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);padding:6px 0;min-width:90px;">
`;
            if (isMine || isAdmin) {
                menuHtml += `<button class="edit-btn">Sửa</button><button class="delete-btn">Xoá</button>`;
            } else {
                menuHtml += `<button class="report-btn">Báo cáo</button>`;
            }
            menuHtml += `</div>`;
            // Xử lý nội dung rút gọn
            let fullContent = post.title;
            let shortContent = fullContent.length > 350 ? fullContent.slice(0, 350) + '...' : fullContent;
            let showReadMore = fullContent.length > 350;
            function highlightTags(text) {
                // Tô màu các từ bắt đầu bằng #
                return text.replace(/(#\w+)/g, '<span class="tag-item">$1</span>');
            }
            let contentHtml = highlightTags(fullContent); // hoặc post.content nếu bạn dùng content
            let shortContentHtml = highlightTags(shortContent);
            li.innerHTML = `
                <div class="post-row">
                    <span class="post-author-avatar">${authorFirstChar}</span>
                    <span class="post-author-name">${authorNameHtml}</span>
                </div>
                <div class="post-content"><b>${shortContentHtml}</b></div>
                ${showReadMore ? '<button class="read-more-btn">Đọc thêm</button>' : ''}
                <span class="menu-wrapper">${menuHtml}</span>
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
            // Giả sử post.tags là mảng tag
            let tagsHtml = '';
            if (post.tags && post.tags.length) {
                tagsHtml = `<div style="margin-top:10px;" class="tag-list">` +
                    post.tags.map(tag => `<span class="tag-item" onclick="filterByTag('${tag}')">#${tag}</span>`).join(' ') +
                    `</div>`;
            }
            li.innerHTML += tagsHtml;
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
                console.log('Like button clicked', postId);
                await handleReaction(postId, 'like', li);
            };
            dislikeBtn.onclick = async function () {
                console.log('Dislike button clicked', postId);
                await handleReaction(postId, 'dislike', li);
            };

            // Xử lý menu-dot
            const menuDot = li.querySelector('.menu-dot');
            const menuDropdown = li.querySelector('.menu-dropdown');
            menuDot.onclick = function (e) {
                e.stopPropagation();
                // Ẩn tất cả menu khác
                document.querySelectorAll('.menu-dropdown').forEach(m => m.style.display = 'none');
                menuDropdown.style.display = menuDropdown.style.display === 'block' ? 'none' : 'block';
            };
            document.addEventListener('click', function hideMenu(e) {
                if (!e.target.closest('.menu-wrapper')) menuDropdown.style.display = 'none';
            });
            // Xử lý xoá bài
            const deleteBtn = li.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = async function () {
                    if (!confirm('Bạn có chắc muốn xoá bài viết này?')) return;
                    const token = localStorage.getItem('token');
                    const res = await fetch(`https://website-datz.onrender.com/posts/${postId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        alert('Đã xoá bài!');
                        loadPosts();
                    } else {
                        const data = await res.json().catch(() => null);
                        alert(data?.error || 'Không xoá được bài!');
                    }
                };
            }

            // Xử lý báo cáo bài viết
            const reportBtn = li.querySelector('.report-btn');
            if (reportBtn) {
                reportBtn.onclick = async function () {
                    menuDropdown.style.display = 'none';
                    const token = localStorage.getItem('token');
                    const res = await fetch(`https://website-datz.onrender.com/posts/${postId}/report`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                    });
                    let data = null;
                    try { data = await res.json(); } catch (e) { }
                    if (res.ok) alert(data?.message || 'Đã gửi báo cáo cho admin!');
                    else alert(data?.error || 'Không gửi được báo cáo!');
                };
            }

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
        const res = await fetch(`https://website-datz.onrender.com/comments/${postId}`);
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
                    fetch(`https://website-datz.onrender.com/posts/${postId}/view`, {
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
        const res = await fetch(`https://website-datz.onrender.com/comments/${postId}`);
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
            const res = await fetch('https://website-datz.onrender.com/comments', {
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

    async function handleReaction(postId, type, li) {
        console.log('handleReaction', postId, type, li);
        const token = localStorage.getItem('token');
        if (!token) return alert('Bạn cần đăng nhập để thực hiện hành động này!');
        const res = await fetch(`https://website-datz.onrender.com/posts/${postId}/reaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ reaction: type })
        });
        const data = await res.json();
        console.log('Reaction response:', res.ok, data);
        if (res.ok) {
            // Cập nhật lại số lượng like/dislike trên UI
            const likeCountSpan = li.querySelector('.like-count');
            const dislikeCountSpan = li.querySelector('.dislike-count');
            if (likeCountSpan) likeCountSpan.textContent = data.like_count ?? data.new_like_count ?? 0;
            if (dislikeCountSpan) dislikeCountSpan.textContent = data.dislike_count ?? data.new_dislike_count ?? 0;

            // Cập nhật trạng thái active của nút
            const likeBtn = li.querySelector('.like-btn');
            const dislikeBtn = li.querySelector('.dislike-btn');
            likeBtn.classList.remove('active');
            dislikeBtn.classList.remove('active');
            likeBtn.querySelector('.bx').style.color = '';
            dislikeBtn.querySelector('.bx').style.color = '';
            if (data.user_reaction === 'like') {
                likeBtn.classList.add('active');
                likeBtn.querySelector('.bx').style.color = '#4070f4';
                console.log('Added active to likeBtn', likeBtn, likeBtn.className);
            } else if (data.user_reaction === 'dislike') {
                dislikeBtn.classList.add('active');
                dislikeBtn.querySelector('.bx').style.color = '#e74c3c';
                console.log('Added active to dislikeBtn', dislikeBtn, dislikeBtn.className);
            }
        } else {
            alert(data.error || 'Không thể thực hiện reaction!');
        }
    }

    function setupMenuEvents() {
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
                    const res = await fetch(`https://website-datz.onrender.com/posts/${id}`, {
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
    }

    function showUserInfoPopup(user, evt, avatarEl) {
        let oldPopup = document.querySelector('.user-info-popup');
        if (oldPopup) oldPopup.remove();
        let popup = document.createElement('div');
        popup.className = 'user-info-popup';
        popup.innerHTML = `
            <div class="user-info-name"><b>${user.name}</b></div>
            <div class="user-info-id">ID: ${user.id}</div>
            <div class="user-info-email">Email: ${user.email}</div>
                <div id="profileBtnWrap"></div>
            `;
        document.body.appendChild(popup);

        // Định vị popup
        const rect = avatarEl.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.left = rect.left + window.scrollX - (popup.offsetWidth / 2) + (rect.width / 2) + 'px';
        popup.style.top = rect.bottom + window.scrollY + 10 + 'px';
        popup.style.zIndex = 99999;
        // Đóng popup khi click ra ngoài
        setTimeout(() => {
            function closePopup(e) {
                if (!popup.contains(e.target) && e.target !== avatarEl) {
                    popup.remove();
                    document.removeEventListener('mousedown', closePopup);
                }
            }
            document.addEventListener('mousedown', closePopup);
        }, 0);

        // Lọc bài viết của user này
        const btn = document.createElement('button');
        btn.textContent = 'Xem bài viết của user này';
        btn.style = 'padding: 6px 12px; background: #4070f4; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 10px;';
        btn.onclick = function () {
            // Lọc bài viết chỉ của user này
            fetch('https://website-datz.onrender.com/posts').then(r => r.json()).then(posts => {
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

    // --- TAB CHUYỂN TRANG CHỦ / HỎI ĐÁP ---
    const tabHome = document.getElementById('tab-home');
    const tabQA = document.getElementById('tab-qa');
    const homeSection = document.getElementById('homeSection');
    const qaSection = document.getElementById('qaSection');
    const qaDetailSection = document.getElementById('qaDetailSection');
    const qaList = document.getElementById('qaList');
    const backToQAList = document.getElementById('backToQAList');
    if (tabHome && tabQA && homeSection && qaSection) {
        tabHome.onclick = function () {
            tabHome.classList.add('active');
            tabQA.classList.remove('active');
            homeSection.style.display = '';
            qaSection.style.display = 'none';
            if (qaDetailSection) qaDetailSection.style.display = 'none';
        };
        // --- HỎI ĐÁP: Gọi API lấy danh sách câu hỏi và render lên giao diện ---
        // Định nghĩa fetchAndRenderQuestions ở ngoài cùng để có thể gọi ở mọi nơi
        async function fetchAndRenderQuestions() {
            const qaList = document.getElementById('qaList');
            qaList.innerHTML = '<li>Đang tải câu hỏi...</li>';
            try {
                const res = await fetch('https://website-datz.onrender.com/questions');
                const data = await res.json();
                qaList.innerHTML = '';
                if (!Array.isArray(data) || data.length === 0) {
                    qaList.innerHTML = '<li>Chưa có câu hỏi nào.</li>';
                    return;
                }
                data.forEach(q => {
                    const isMine = user && (q.user_id === user.id || q.user?.id === user.id);
                    const isAdmin = user && (user.role === 'admin' || user.role === 'Admin');
                    let menuHtml = `<button class="menu-dot">&#8942;</button><div class="menu-dropdown" style="display:none;position:absolute;z-index:10;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);padding:6px 0;min-width:90px;">`;
                    if (isMine || isAdmin) {
                        menuHtml += `<button class="edit-qa-btn" style="color:#4070f4;width:100%;background:none;border:none;padding:8px 16px;text-align:left;cursor:pointer;">Sửa</button>`;
                        menuHtml += `<button class="delete-qa-btn" style="color:#e74c3c;width:100%;background:none;border:none;padding:8px 16px;text-align:left;cursor:pointer;">Xoá</button>`;
                    } else {
                        menuHtml += `<button class="report-qa-btn" style="color:#222;font-size:0.92em;width:100%;background:none;border:none;padding:4px 12px;text-align:left;cursor:pointer;">Báo cáo</button>`;
                    }
                    menuHtml += `</div>`;
                    let postId = q.post_id || q.postId || q.PostID || null;
                    let viewPostBtn = postId ? `<button class='view-post-btn' style='background:#fff;color:#4070f4;border:1px solid #4070f4;border-radius:6px;padding:6px 18px;cursor:pointer;margin-left:10px;'>Xem bài viết</button>` : '';
                    // Định dạng ngày giờ đăng
                    let createdAt = q.created_at || q.CreatedAt || q.createdAt;
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
                    const li = document.createElement('li');
                    li.className = 'qa-item';
                    li.style = 'margin-bottom:18px;padding:18px 20px;border-radius:10px;background:#f7fafd;box-shadow:0 1px 4px rgba(64,112,244,0.04);position:relative;';
                    li.innerHTML = `
                        <div class="qa-title-row" style="position: relative; min-height: 32px;">
                            <div class="qa-title" style="padding-right: 32px;">${q.title}</div>
                            <span class="menu-wrapper" style="position: absolute; top: 0; right: 0; z-index: 2;">${menuHtml}</span>
                        </div>
                        <div style="color:#888;font-size:0.98rem;margin:6px 0 8px 0;">
                            Tag: <span style="color:#4070f4;">${q.tag || 'Chung'}</span> |
                            ${(q.answers?.length || 0)} câu trả lời |
                            Hỏi bởi: <b>${q.user?.name || 'Ẩn danh'}</b>${dateStr}
                        </div>
                        <button class="view-qa-btn" style="background:#4070f4;color:#fff;border:none;border-radius:6px;padding:6px 18px;cursor:pointer;">Xem chi tiết</button>
                        ${viewPostBtn}
                    `;
                    // Xử lý menu-dot
                    const menuDot = li.querySelector('.menu-dot');
                    const menuDropdown = li.querySelector('.menu-dropdown');
                    menuDot.onclick = function (e) {
                        e.stopPropagation();
                        document.querySelectorAll('.menu-dropdown').forEach(m => m.style.display = 'none');
                        menuDropdown.style.display = menuDropdown.style.display === 'block' ? 'none' : 'block';
                    };
                    document.addEventListener('click', function hideMenu(e) {
                        if (!e.target.closest('.menu-wrapper')) menuDropdown.style.display = 'none';
                    });
                    // Xử lý sửa câu hỏi
                    const editBtn = li.querySelector('.edit-qa-btn');
                    if (editBtn) {
                        editBtn.onclick = function () {
                            menuDropdown.style.display = 'none';
                            // Hiện form sửa ngay trên li
                            li.innerHTML = `
                                <form class="edit-qa-form" style="display:flex;flex-direction:column;gap:10px;background:#f7fafd;padding:18px 20px;border-radius:10px;">
                                    <input type="text" name="title" value="${q.title.replace(/"/g, '&quot;')}" placeholder="Tiêu đề câu hỏi..." required style="font-size:1.05rem;padding:8px 12px;border-radius:6px;border:1px solid #ccc;">
                                    <textarea name="content" required style="font-size:1rem;padding:8px 12px;border-radius:6px;border:1px solid #ccc;min-height:60px;">${q.content || ''}</textarea>
                                    <input type="text" name="tag" value="${q.tag || ''}" placeholder="Thẻ chuyên môn..." maxlength="50" style="font-size:1rem;padding:8px 12px;border-radius:6px;border:1px solid #ccc;">
                                    <div style="display:flex;gap:10px;">
                                        <button type="submit" style="background:#4070f4;color:#fff;border:none;border-radius:6px;padding:7px 18px;cursor:pointer;">Lưu</button>
                                        <button type="button" class="cancel-edit-btn" style="background:#eee;color:#333;border:none;border-radius:6px;padding:7px 18px;cursor:pointer;">Huỷ</button>
                                    </div>
                                </form>
                            `;
                            const form = li.querySelector('.edit-qa-form');
                            form.onsubmit = async function (e) {
                                e.preventDefault();
                                const title = form.title.value.trim();
                                const content = form.content.value.trim();
                                const tag = form.tag.value.trim();
                                if (!title || !content) return alert('Vui lòng nhập đủ tiêu đề và nội dung!');
                                if (title.length > 100) return alert('Tiêu đề không được vượt quá 100 ký tự!');
                                if (content.length > 500) return alert('Nội dung không được vượt quá 500 ký tự!');
                                if (tag.length > 50) return alert('Thẻ không được vượt quá 50 ký tự!');
                                const token = localStorage.getItem('token');
                                const res = await fetch(`https://website-datz.onrender.com/questions/${q.ID || q.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                                    body: JSON.stringify({ title, content, tag })
                                });
                                if (res.ok) {
                                    alert('Đã cập nhật câu hỏi!');
                                    fetchAndRenderQuestions();
                                } else {
                                    const data = await res.json().catch(() => null);
                                    alert(data?.error || 'Không cập nhật được câu hỏi!');
                                }
                            };
                            form.querySelector('.cancel-edit-btn').onclick = function () {
                                fetchAndRenderQuestions();
                            };
                        };
                    }
                    // Xử lý xoá câu hỏi
                    const deleteBtn = li.querySelector('.delete-qa-btn');
                    if (deleteBtn) {
                        deleteBtn.onclick = async function () {
                            if (!confirm('Bạn có chắc muốn xoá câu hỏi này?')) return;
                            const token = localStorage.getItem('token');
                            const res = await fetch(`https://website-datz.onrender.com/questions/${q.ID || q.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': 'Bearer ' + token }
                            });
                            if (res.ok) {
                                alert('Đã xoá câu hỏi!');
                                fetchAndRenderQuestions();
                            } else {
                                const data = await res.json().catch(() => null);
                                alert(data?.error || 'Không xoá được câu hỏi!');
                            }
                        };
                    }
                    // Xử lý báo cáo câu hỏi
                    const reportBtn = li.querySelector('.report-qa-btn');
                    if (reportBtn) {
                        reportBtn.onclick = async function () {
                            menuDropdown.style.display = 'none';
                            const token = localStorage.getItem('token');
                            const res = await fetch(`https://website-datz.onrender.com/questions/${q.ID || q.id}/report`, {
                                method: 'POST',
                                headers: { 'Authorization': 'Bearer ' + token },
                            });
                            let data = null;
                            try { data = await res.json(); } catch (e) { }
                            if (res.ok) alert(data?.message || 'Đã gửi báo cáo cho admin!');
                            else alert(data?.error || 'Không gửi được báo cáo!');
                        };
                    }
                    // Gán sự kiện Xem chi tiết
                    li.querySelector('.view-qa-btn').onclick = async function () {
                        qaSection.style.display = 'none';
                        qaDetailSection.style.display = '';
                        await renderQuestionDetail(q.ID || q.id);
                    };
                    // Xử lý nút xem bài viết
                    if (postId) {
                        li.querySelector('.view-post-btn').onclick = function () {
                            tabHome.classList.add('active');
                            tabQA.classList.remove('active');
                            homeSection.style.display = ''; // Hiển thị homeSection
                            qaSection.style.display = 'none'; // Ẩn qaSection
                            if (qaDetailSection) qaDetailSection.style.display = 'none'; // Ẩn qaDetailSection
                            loadPosts(); // Load lại danh sách bài viết trên trang chủ
                        };
                    }
                    qaList.appendChild(li);
                });
            } catch (e) {
                qaList.innerHTML = '<li>Lỗi khi tải câu hỏi!</li>';
            }
        }
        // Gọi khi vào tab Hỏi Đáp
        if (tabQA) {
            tabQA.onclick = function () {
                tabQA.classList.add('active');
                tabHome.classList.remove('active');
                homeSection.style.display = 'none';
                qaSection.style.display = '';
                if (qaDetailSection) qaDetailSection.style.display = 'none';
                fetchAndRenderQuestions();

                // Gán lại sự kiện submit cho form hỏi đáp mỗi khi chuyển tab
                const askForm = document.getElementById('askForm');
                const askTitle = document.getElementById('askTitle');
                const askContent = document.getElementById('askContent');
                const askTag = document.getElementById('askTag');
                if (askForm)
                    askForm.onsubmit = async function (e) {
                        e.preventDefault();
                        console.log('Submit form hỏi đáp');
                        const title = askTitle.value.trim();
                        const content = askContent.value.trim();
                        const tag = askTag.value.trim();
                        const err = validateQAForm('question', content, tag, title);
                        if (err) { alert(err); return; }
                        if (!title || !content) return alert('Vui lòng nhập đủ tiêu đề và nội dung!');
                        const token = localStorage.getItem('token');
                        try {
                            const res = await fetch('https://website-datz.onrender.com/questions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token
                                },
                                body: JSON.stringify({ title, content, tag })
                            });
                            let data = null;
                            try { data = await res.json(); } catch (e) { }
                            if (res.ok) {
                                askForm.reset();
                                fetchAndRenderQuestions();
                            } else {
                                alert((data && data.error) || 'Lỗi khi đăng câu hỏi!');
                            }
                        } catch (err) {
                            alert('Lỗi khi kết nối server!');
                        }
                    };
            }
            // Đặt ngoài để luôn gán sự kiện, tránh lặp lại nhiều lần
            const answerForm = document.getElementById('answerForm');
            if (answerForm) {
                answerForm.onsubmit = async function (e) {
                    e.preventDefault();
                    const answerContent = document.getElementById('answerContent').value.trim();
                    const answerTag = document.getElementById('answerTag').value.trim();
                    const questionId = document.getElementById('qaDetailSection').getAttribute('data-question-id');
                    const err = validateQAForm('answer', answerContent, answerTag);
                    if (err) { alert(err); return; }
                    if (!answerContent) return alert('Vui lòng nhập nội dung trả lời!');
                    const token = localStorage.getItem('token');
                    if (!token) return alert('Bạn cần đăng nhập để trả lời!');
                    try {
                        const res = await fetch('https://website-datz.onrender.com/answers', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify({
                                content: answerContent,
                                question_id: Number(questionId),
                                tag: answerTag
                            })
                        });
                        const text = await res.text();
                        console.log('API trả về:', text);
                        let data = null;
                        try { data = JSON.parse(text); } catch (e) { }
                        if (res.ok) {
                            answerForm.reset();
                            if (questionId) {
                                try {
                                    await renderQuestionDetail(questionId);
                                } catch (err) {
                                    console.error('Lỗi khi render lại chi tiết câu hỏi:', err);
                                    alert('Lỗi khi hiển thị lại câu hỏi!');
                                }
                            }
                            // Gọi lại fetchAndRenderQuestions để cập nhật số lượt trả lời
                            if (typeof fetchAndRenderQuestions === 'function') fetchAndRenderQuestions();
                        } else {
                            alert((data && data.error) || 'Lỗi khi gửi trả lời!');
                        }
                    } catch (err) {
                        console.error('Lỗi thực sự khi gửi trả lời:', err);
                        alert('Lỗi khi kết nối server!');
                    }
                };
            }
        };
    }
    // Gọi khi load trang nếu đang ở tab Hỏi Đáp
    if (qaSection && qaSection.style.display !== 'none') {
        fetchAndRenderQuestions();
    }

    // --- HỎI ĐÁP: Gửi API tạo câu hỏi mới ---
    const askForm = document.getElementById('askForm');
    const askTitle = document.getElementById('askTitle');
    const askContent = document.getElementById('askContent');
    const askTag = document.getElementById('askTag');
    if (askForm) {
        askForm.onsubmit = async function (e) {
            e.preventDefault();
            const title = askTitle.value.trim();
            const content = askContent.value.trim();
            const tag = askTag.value.trim();
            const err = validateQAForm('question', content, tag, title);
            if (err) { alert(err); return; }
            if (!title || !content) return alert('Vui lòng nhập đủ tiêu đề và nội dung!');
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('https://website-datz.onrender.com/questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ title, content, tag })
                });
                let data = null;
                try { data = await res.json(); } catch (e) { }
                if (res.ok) {
                    askForm.reset();
                    fetchAndRenderQuestions();
                } else {
                    alert((data && data.error) || 'Lỗi khi đăng câu hỏi!');
                }
            } catch (err) {
                alert('Lỗi khi kết nối server!');
            }
        };
    }

    // LOAD BÀI VIẾT LẦN ĐẦU
    loadPosts();

    // Gắn counter cho form hỏi đáp (tab Q&A)
    const askContentEl = document.getElementById('askContent');
    const askTagEl = document.getElementById('askTag');
    if (askContentEl) attachCharCounter(askContentEl, 2500, 'askContentCounter');
    if (askTagEl) attachCharCounter(askTagEl, 50, 'askTagCounter');
    // Gắn counter cho form trả lời (tab chi tiết Q&A)
    const answerContentEl = document.getElementById('answerContent');
    const answerTagEl = document.getElementById('answerTag');
    if (answerContentEl) attachCharCounter(answerContentEl, 500, 'answerContentCounter');
    if (answerTagEl) attachCharCounter(answerTagEl, 50, 'answerTagCounter');
    // Gắn counter cho tiêu đề câu hỏi (250 ký tự)
    const askTitleEl = document.getElementById('askTitle');
    if (askTitleEl) attachCharCounter(askTitleEl, 250, 'askTitleCounter');

    // Sau khi load trang, nếu đang ở trang chi tiết Q&A thì render lại filter tag
    const qaDetailSectionEl = document.getElementById('qaDetailSection');
    if (qaDetailSectionEl && qaDetailSectionEl.style.display !== 'none') {
        const qid = qaDetailSectionEl.getAttribute('data-question-id');
        if (qid) renderQuestionDetail(qid);
    }

    // Hỗ trợ anchor #question-<id> để chuyển thẳng đến chi tiết câu hỏi và làm nổi bật
    const hash = window.location.hash;
    if (hash && hash.startsWith('#question-')) {
        const qid = hash.replace('#question-', '');

        // Điều chỉnh hiển thị tab và section một cách tường minh
        const tabQA = document.getElementById('tab-qa');
        const tabHome = document.getElementById('tab-home');
        const homeSection = document.getElementById('homeSection');
        const qaSection = document.getElementById('qaSection');
        const qaDetailSection = document.getElementById('qaDetailSection');

        // Kích hoạt tab Hỏi Đáp
        if (tabQA) tabQA.classList.add('active');
        if (tabHome) tabHome.classList.remove('active');

        // Hiển thị qaDetailSection và ẩn các section khác
        if (homeSection) homeSection.style.display = 'none';
        if (qaSection) qaSection.style.display = 'none'; // Ẩn danh sách câu hỏi
        if (qaDetailSection) qaDetailSection.style.display = ''; // Hiển thị chi tiết câu hỏi

        // Chờ một chút để DOM ổn định, sau đó render và highlight
        setTimeout(async () => {
            await renderQuestionDetail(qid); // Đảm bảo nội dung đã được render
            const targetQaDetailSection = document.getElementById('qaDetailSection'); // Lấy lại element sau khi render
            if (targetQaDetailSection) {
                targetQaDetailSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetQaDetailSection.classList.add('qa-highlight');
                setTimeout(() => {
                    targetQaDetailSection.classList.remove('qa-highlight');
                }, 2000);
            }
        }, 100); // Thời gian chờ ngắn để DOM kịp cập nhật
    }

    // Leaderboard
    const leaderboardTypes = {
    };
    const dropdownBtn = document.getElementById('leaderboardDropdownBtn');
    const dropdownMenu = document.getElementById('leaderboardDropdownMenu');
    const descBox = document.getElementById('leaderboardDesc');
    const leaderboardSections = {
        score: document.getElementById('leaderboardSection-score'),
        like: document.getElementById('leaderboardSection-like'),
        view: document.getElementById('leaderboardSection-view'),
        contribution: document.getElementById('leaderboardSection-contribution'),
    };
    function renderBadge(badge) {
        if (badge === 'Kim cương') return '<span class="badge badge-diamond">Kim cương</span>';
        if (badge === 'Vàng') return '<span class="badge badge-gold">Vàng</span>';
        if (badge === 'Bạc') return '<span class="badge badge-silver">Bạc</span>';
        return '<span class="badge badge-bronze">Đồng</span>';
    }
    async function loadLeaderboard(type) {
        const section = leaderboardSections[type];
        if (!section) return;
        section.innerHTML = `<table class="leaderboard-table">
        <thead><tr><th>Hạng</th><th>Tên</th><th>Điểm</th><th>Bài viết</th><th>Trả lời</th><th>Like</th><th>View</th><th>Huy hiệu</th></tr></thead>
        <tbody><tr><td colspan="8">Đang tải...</td></tr></tbody></table>`;
        try {
            const res = await fetch(`https://website-datz.onrender.com/leaderboard?sort=${type}`);
            const data = await res.json();
            let rows = '';
            data.forEach((u, idx) => {
                rows += `<tr>
            <td>${idx + 1}</td>
            <td>${u.name}</td>
            <td>${u.score}</td>
            <td>${u.post_count}</td>
            <td>${u.answer_count}</td>
            <td>${u.like_count}</td>
            <td>${u.view_count}</td>
            <td>${renderBadge(u.badge)}</td>
          </tr>`;
            });
            section.querySelector('tbody').innerHTML = rows;
        } catch (e) {
            section.querySelector('tbody').innerHTML = '<tr><td colspan="8">Lỗi khi tải bảng xếp hạng!</td></tr>';
        }
    }
    dropdownBtn.onclick = function (e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    };
    dropdownMenu.querySelectorAll('div').forEach(item => {
        item.onclick = function () {
            // Ẩn tất cả bảng
            Object.keys(leaderboardSections).forEach(type => {
                leaderboardSections[type].style.display = 'none';
            });
            // Hiện bảng được chọn
            const type = this.dataset.type;
            leaderboardSections[type].style.display = '';
            descBox.textContent = leaderboardTypes[type];
            descBox.style.display = '';
            dropdownMenu.style.display = 'none';
            loadLeaderboard(type);
        };
    });
    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
    // Ẩn tất cả bảng xếp hạng mặc định
    Object.values(leaderboardSections).forEach(sec => sec.style.display = 'none');
    descBox.style.display = 'none';

    // Xử lý tìm kiếm bài viết
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const authorInput = document.getElementById('authorInput');

    if (searchBtn) {
        searchBtn.onclick = async function () {
            const keyword = searchInput.value.trim().toLowerCase();
            const author = authorInput.value.trim().toLowerCase();

            // Lấy toàn bộ bài viết từ backend
            const res = await fetch('https://website-datz.onrender.com/posts');
            let posts = await res.json();

            // Lọc theo từ khóa và tác giả
            if (keyword) {
                posts = posts.filter(post =>
                    (post.title || '').toLowerCase().includes(keyword)
                );
            }
            if (author) {
                posts = posts.filter(post =>
                    (post.user?.name || post.user?.Name || '').toLowerCase().includes(author)
                );
            }

            // Hiển thị kết quả
            loadPosts(posts);
        };
    }
    [searchInput, authorInput].forEach(input => {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    });
});

async function renderQuestionDetail(questionId) {
    try {
        const res = await fetch(`https://website-datz.onrender.com/questions/${questionId}`);
        const detail = await res.json();
        const qaDetailSection = document.getElementById('qaDetailSection');
        qaDetailSection.setAttribute('data-question-id', questionId);
        document.getElementById('qaDetailTitle').textContent = detail.title;
        document.getElementById('qaDetailTag').textContent = detail.tag || 'Chung';
        document.getElementById('qaDetailUser').textContent = detail.user?.name || 'Ẩn danh';
        // Hiển thị ngày giờ đăng giống trang chủ
        let createdAt = detail.created_at || detail.CreatedAt || detail.createdAt;
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
        document.getElementById('qaDetailUser').innerHTML += dateStr;
        document.getElementById('qaDetailBody').textContent = detail.content;
        // Filter tag UI
        const answerList = document.getElementById('answerList');
        const filterWrapId = 'answerTagFilterWrap';
        let filterWrap = document.getElementById(filterWrapId);
        if (!filterWrap) {
            filterWrap = document.createElement('div');
            filterWrap.id = filterWrapId;
            filterWrap.style = 'margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;';
            answerList.parentNode.insertBefore(filterWrap, answerList);
        }
        // Lấy tất cả tag duy nhất trong answers và đếm tần suất
        const tagCount = {};
        (detail.answers || []).forEach(a => { if (a.tag) tagCount[a.tag] = (tagCount[a.tag] || 0) + 1; });
        // Nếu chưa có answer nào nhưng câu hỏi có tag, vẫn hiển thị tag filter
        if (Object.keys(tagCount).length === 0 && detail.tag) {
            tagCount[detail.tag] = 1;
        }
        let tags = Object.keys(tagCount);
        tags.sort((a, b) => tagCount[b] - tagCount[a]); // Sắp xếp theo tần suất giảm dần
        const MAX_TAGS = 6;
        let showAllTags = false;
        function renderTagFilters() {
            filterWrap.innerHTML = '';
            // Nút filter "Tất cả"
            const allBtn = document.createElement('button');
            allBtn.textContent = 'Tất cả';
            allBtn.className = 'qa-tag-filter active';
            allBtn.style = 'background:#4070f4;color:#fff;border:none;border-radius:8px;padding:5px 16px;cursor:pointer;font-size:0.98rem;';
            filterWrap.appendChild(allBtn);
            let tagsToShow = showAllTags ? tags : tags.slice(0, MAX_TAGS);
            if (tags.length === 0) {
                const noTag = document.createElement('span');
                noTag.textContent = 'Chưa có thẻ chuyên môn';
                noTag.style = 'color:#888;font-size:0.97rem;margin-left:10px;';
                filterWrap.appendChild(noTag);
            } else {
                tagsToShow.forEach(tag => {
                    const btn = document.createElement('button');
                    btn.textContent = '#' + tag;
                    btn.className = 'qa-tag-filter';
                    btn.style = 'background:#e3eaff;color:#4070f4;border:none;border-radius:8px;padding:5px 16px;cursor:pointer;font-size:0.98rem;';
                    filterWrap.appendChild(btn);
                });
                if (tags.length > MAX_TAGS) {
                    const moreBtn = document.createElement('button');
                    moreBtn.textContent = showAllTags ? 'Thu gọn...' : 'Xem thêm...';
                    moreBtn.className = 'qa-tag-filter';
                    moreBtn.style = 'background:#f3f4f6;color:#4070f4;border:none;border-radius:8px;padding:2px 10px;cursor:pointer;font-size:0.85rem;height:28px;line-height:24px;';
                    moreBtn.onclick = function () {
                        showAllTags = !showAllTags;
                        renderTagFilters();
                        // Giữ trạng thái active cho filter hiện tại
                        const active = filterWrap.querySelector('button.active');
                        if (active) active.classList.remove('active');
                        allBtn.classList.add('active');
                        renderAnswersByTag('all');
                    };
                    filterWrap.appendChild(moreBtn);
                }
            }
            // Gán lại sự kiện filter
            allBtn.onclick = function () {
                filterWrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                renderAnswersByTag('all');
            };
            filterWrap.querySelectorAll('.qa-tag-filter').forEach(btn => {
                if (btn === allBtn) return;
                if (btn.textContent.endsWith('...')) return;
                btn.onclick = function () {
                    filterWrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderAnswersByTag(btn.textContent.replace(/^#/, ''));
                };
            });
        }
        renderTagFilters();
        // Hàm render answers theo tag
        function renderAnswersByTag(tagFilter) {
            answerList.innerHTML = '';
            let answers = detail.answers || [];
            if (tagFilter && tagFilter !== 'all') {
                answers = answers.filter(a => a.tag === tagFilter);
            }
            if (answers.length === 0) {
                answerList.innerHTML = '<li>Chưa có câu trả lời nào.</li>';
                return;
            }
            answers.forEach(a => {
                const ansLi = document.createElement('li');
                ansLi.className = 'answer-item';
                ansLi.style = 'margin-bottom:14px;padding:14px 16px;border-radius:10px;background:#f7fafd;box-shadow:0 1px 4px rgba(64,112,244,0.04);';
                ansLi.innerHTML = `
                    <div style="font-weight:500;">${a.content}</div>
                    <div style="color:#888;font-size:0.97rem;">
                        Trả lời bởi: <b>${a.user?.name || 'Ẩn danh'}</b>
                        ${a.tag ? `<span class="qa-tag" style="margin-left:10px;background:#e3eaff;color:#4070f4;border-radius:8px;padding:2px 10px;">#${a.tag}</span>` : ''}
                    </div>
                `;
                answerList.appendChild(ansLi);
            });
        }
        // Mặc định hiện tất cả
        renderAnswersByTag('all');
    } catch (err) {
        alert('Lỗi khi tải chi tiết câu hỏi!');
    }
}

const backToQAList = document.getElementById('backToQAList');
if (backToQAList) {
    backToQAList.onclick = function () {
        // Chuyển về tab danh sách Q&A
        const qaSection = document.getElementById('qaSection');
        const qaDetailSection = document.getElementById('qaDetailSection');
        const tabQA = document.getElementById('tab-qa');
        const tabHome = document.getElementById('tab-home');
        if (qaSection) qaSection.style.display = '';
        if (qaDetailSection) qaDetailSection.style.display = 'none';
        if (tabQA) tabQA.classList.add('active');
        if (tabHome) tabHome.classList.remove('active');
        // Gọi lại fetchAndRenderQuestions nếu có
        if (typeof fetchAndRenderQuestions === 'function') fetchAndRenderQuestions();
    };
}

// Hàm kiểm tra giới hạn ký tự khi gửi câu hỏi, trả lời, thẻ
function validateQAForm(type, content, tag, title) {
    if (type === 'question') {
        if (title && title.length > 250) return 'Tiêu đề không được vượt quá 250 ký tự!';
        if (content.length > 2500) return 'Câu hỏi không được vượt quá 2500 ký tự!';
    }
    if (type === 'answer' && content.length > 500) return 'Câu trả lời không được vượt quá 500 ký tự!';
    if (tag && tag.length > 50) return 'Thẻ không được vượt quá 50 ký tự!';
    return '';
}

// Hàm tạo bộ đếm ký tự cho input/textarea
function attachCharCounter(input, max, counterId) {
    let counter = document.getElementById(counterId);
    if (!counter) {
        counter = document.createElement('div');
        counter.id = counterId;
        counter.style = 'font-size:0.75em;color:#888;margin-top:-5px;text-align:right;';
        // Đảm bảo nằm dưới input/textarea
        if (input.nextSibling) {
            input.parentNode.insertBefore(counter, input.nextSibling);
        } else {
            input.parentNode.appendChild(counter);
        }
    }
    function updateCounter() {
        let val = input.value;
        if (val.length > max) {
            input.value = val.slice(0, max);
        }
        counter.textContent = input.value.length + '/' + max;
    }
    input.addEventListener('input', updateCounter);
    updateCounter();
}