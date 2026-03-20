const POSTS_PER_PAGE = 10;
const TOTAL_POSTS = 100;
let currentPage = 1;
let isLoading = false;
let allLoaded = false;

async function fetchPosts(page) {
    const start = (page - 1) * POSTS_PER_PAGE + 1;
    const end = Math.min(page * POSTS_PER_PAGE, TOTAL_POSTS);

    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const posts = await Promise.all(
        ids.map(id =>
            fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)
                .then(r => r.json())
        )
    );

    const userIds = [...new Set(posts.map(p => p.userId))];

    const users = await Promise.all(
        userIds.map(id =>
            fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
                .then(r => r.json())
        )
    );

    const userMap = users.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
    }, {});

    return posts.map(post => ({
        ...post,
        author: userMap[post.userId]
    }));
}

function getInitials(name) {
    return name.split(" ").map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function createPostElement(post) {
    const el = document.createElement("article");
    el.className = "post";

    el.innerHTML = `
        <div class='post-header'>
            <div class='avatar'>${getInitials(post.author.name)}</div>
            <div class='post-meta'>
                <div class='author-name'>${post.author.name}</div>
                <div class='post-date'>${post.author.company.name}</div>
            </div>
        </div>
        <h2 class='post-title'>${post.title}</h2>
        <p class='post-body'>${post.body}</p>
        <div class='post-actions'>
            <button class='action-btn'>👍 Like</button>
            <button class='action-btn'>💬 Reply</button>
            <button class='action-btn'>🔁 Share</button>
        </div>
    `;

    return el;
}

async function loadNextPage() {
    if (isLoading || allLoaded) return;

    isLoading = true;
    document.querySelector("#loader").style.display = "block";

    try {
        const posts = await fetchPosts(currentPage);
        const container = document.querySelector("#postsContainer");

        posts.forEach((post, i) => {
            const el = createPostElement(post);
            container.appendChild(el);

            setTimeout(() => el.classList.add("is-visible"), i * 80);
        });

        currentPage++;

        if (currentPage * POSTS_PER_PAGE > TOTAL_POSTS) {
            allLoaded = true;
            document.querySelector("#loader").style.display = "none";
            document.querySelector("#endMessage").style.display = "block";
        }
    } catch (error) {
        console.error("Failed to load posts:", error);
    } finally {
        isLoading = false;

        if (!allLoaded) {
            document.querySelector("#loader").style.display = "none";
        }
    }
}

const observer = new IntersectionObserver(
    (entries) => {
        if (entries[0].isIntersecting) loadNextPage();
    },
    { rootMargin: "200px" }
);

observer.observe(document.querySelector("#loader"));

loadNextPage();