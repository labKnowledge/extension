// One-click cleanups for popular sites. Each item is an ordinary rule that
// may match many elements. Selectors were checked against the live sites on
// 2026-10-01 (logged-out where possible); `verified: false` marks selectors
// taken from widely used community lists that could not be checked without
// an account. The popup shows "Not on this page" if a site changes, so a
// stale selector is visible rather than silently broken.
(function initQuietViewRecipes(global) {
  const RECIPES = [
    {
      site: "YouTube",
      hosts: ["youtube.com", "www.youtube.com", "m.youtube.com"],
      items: [
        {
          id: "yt-shorts",
          label: "Shorts",
          selector:
            'ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer, ytd-guide-entry-renderer:has(a[title="Shorts"]), ytd-mini-guide-entry-renderer:has(a[title="Shorts"])'
        },
        { id: "yt-related", label: "Recommendations next to videos", selector: "ytd-watch-next-secondary-results-renderer" },
        { id: "yt-home-feed", label: "Home page feed", selector: 'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer' },
        { id: "yt-comments", label: "Comments", selector: "ytd-comments#comments" },
        { id: "yt-endscreen", label: "End-of-video suggestions", selector: ".ytp-ce-element, .ytp-endscreen-content" }
      ]
    },
    {
      site: "Reddit",
      hosts: ["www.reddit.com", "reddit.com"],
      items: [
        { id: "rd-right-sidebar", label: "Right sidebar", selector: "#right-sidebar-container" },
        { id: "rd-left-nav", label: "Left navigation", selector: "#left-sidebar-container" }
      ]
    },
    {
      site: "X",
      hosts: ["x.com", "twitter.com"],
      items: [
        { id: "x-sidebar", label: "Trends and “Who to follow”", selector: '[data-testid="sidebarColumn"]', verified: false }
      ]
    },
    {
      site: "Twitch",
      hosts: ["www.twitch.tv", "twitch.tv"],
      items: [
        { id: "tw-sidenav", label: "Recommended channels sidebar", selector: '[data-a-target="side-nav-bar"]' }
      ]
    },
    {
      site: "WhatsApp",
      hosts: ["web.whatsapp.com"],
      items: [
        {
          id: "wa-blur-chats",
          label: "Blur chat list (hover to peek)",
          selector: "#pane-side",
          hideMode: "blur",
          verified: false
        },
        { id: "wa-hide-chats", label: "Hide chat list", selector: "#side", verified: false }
      ]
    }
  ];

  function recipesForHost(hostname) {
    const host = String(hostname || "").toLowerCase();
    return RECIPES.find((recipe) => recipe.hosts.includes(host)) || null;
  }

  global.QuietViewRecipes = { RECIPES, recipesForHost };
})(typeof globalThis !== "undefined" ? globalThis : window);
