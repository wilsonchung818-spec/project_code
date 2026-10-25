window.SCHOOL_LIFE_LESSON = {
  id: "school-life-001-book",
  index: 1,
  total: 100,
  theme: "学校生活",
  word: "book",
  ipa: "/bʊk/",
  meaning: "书；书本",
  partOfSpeech: "名词 noun",
  canDo: "I can ask and answer about a book.",
  canDoZh: "我能询问并回答：在读什么、这是不是你的书、书在哪里。",
  phonics: {
    build: "b + oo + k",
    sound: "oo = /ʊ/",
    family: ["book", "look", "cook"]
  },
  audio: {
    word: "./assets/audio/book-word.mp3",
    chunks: "./assets/audio/book-chunks.mp3",
    challenge: "./assets/audio/book-answer-challenge.mp3"
  },
  chunks: [
    { id: "read", text: "read a book", zh: "读一本书" },
    { id: "open", text: "open your book", zh: "打开你的书" },
    { id: "close", text: "close your book", zh: "合上你的书" }
  ],
  naturalSpeech: [
    { full: "I am", short: "I'm" },
    { full: "It is", short: "It's" },
    { full: "Where is", short: "Where's" }
  ],
  scenes: [
    {
      id: "reading",
      label: "课堂阅读",
      color: "blue",
      image: "./assets/images/scene-reading.png",
      alt: "女孩询问男孩正在读什么，男孩坐在课桌前读一本书",
      question: "What are you reading?",
      answer: "I'm reading a book.",
      zh: "你在读什么？我在读一本书。",
      audio: "./assets/audio/book-dialogue-1.mp3",
      choices: [
        { label: "storybook", answer: "I'm reading a storybook." },
        { label: "comic book", answer: "I'm reading a comic book." },
        { label: "picture book", answer: "I'm reading a picture book." }
      ]
    },
    {
      id: "showing",
      label: "介绍物品",
      color: "coral",
      image: "./assets/images/scene-showing.png",
      alt: "男孩向女孩展示一本蓝色英语书，两人在课桌旁交谈",
      question: "Is this your English book?",
      answer: "Yes, it is. It's my English book.",
      zh: "这是你的英语书吗？是的，这是我的英语书。",
      audio: "./assets/audio/book-dialogue-2.mp3",
      choices: [
        { label: "English", answer: "Yes, it is. It's my English book." },
        { label: "math", answer: "Yes, it is. It's my math book." },
        { label: "story", answer: "Yes, it is. It's my storybook." }
      ]
    },
    {
      id: "finding",
      label: "寻找位置",
      color: "teal",
      image: "./assets/images/scene-finding.png",
      alt: "女孩询问书在哪里，男孩指向书包里的一本蓝色书",
      question: "Where's your book?",
      answer: "It's in my schoolbag.",
      zh: "你的书在哪里？它在我的书包里。",
      audio: "./assets/audio/book-dialogue-3.mp3",
      choices: [
        { label: "in my bag", answer: "It's in my schoolbag." },
        { label: "on the desk", answer: "It's on the desk." },
        { label: "under the chair", answer: "It's under the chair." }
      ]
    }
  ]
};
