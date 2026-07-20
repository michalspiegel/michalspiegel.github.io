const posts = [
  {
    title: "Building a tiny portfolio site",
    date: "2026-07-18",
    category: "technical",
    summary: "A starter note on creating a minimal github.io page.",
  },
  {
    title: "Why proof-of-concept work matters",
    date: "2026-07-11",
    category: "proof-of-concept",
    summary: "A short reflection on fast experimentation.",
  },
  {
    title: "Notes on extended abstracts",
    date: "2026-06-28",
    category: "extended abstracts",
    summary: "How I structure concise summaries of larger investigations.",
  },
  {
    title: "Personal update",
    date: "2026-06-10",
    category: "personal",
    summary: "Current focus areas and what I am learning.",
  },
];

const sortedPosts = posts
  .slice()
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const blogList = document.getElementById("blog-list");

sortedPosts.forEach((post) => {
  const item = document.createElement("li");
  item.innerHTML = `
    <article>
      <h3>${post.title}</h3>
      <p><strong>${post.date}</strong> · ${post.category}</p>
      <p>${post.summary}</p>
    </article>
  `;
  blogList.appendChild(item);
});
