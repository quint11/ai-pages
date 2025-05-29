const gameData = [
    {
        level: 1,
        title: "关卡 1: 三国风云",
        intro: "你来到了三国时期，请根据下方出现的字，修复构成历史场景的成语。",
        timeLimit: 180, // 3分钟 = 180秒
        scenes: [
            { id: 1, idiom: "草船借箭", image: "images/level1/scene1.jpg", hint: "第一个场景：与诸葛亮智慧相关。" },
            { id: 2, idiom: "三顾茅庐", image: "images/level1/scene2.jpg", hint: "第二个场景：刘备求贤若渴。" },
            { id: 3, idiom: "望梅止渴", image: "images/level1/scene3.jpg", hint: "第三个场景：曹操稳定军心之计。" },
            { id: 4, idiom: "乐不思蜀", image: "images/level1/scene4.jpg", hint: "第四个场景：蜀汉后主的故事。" }
        ],
        // 将所有成语拆字打乱，确保包含所有需要的字
        characters: shuffleArray("草船借箭三顾茅庐望梅止渴乐不思蜀".split(''))
    },
    {
        level: 2,
        title: "关卡 2: 唐诗意境",
        intro: "现在你身处大唐盛世，用成语重现诗中画卷。",
        timeLimit: 180,
        scenes: [
            { id: 1, idiom: "春风得意", image: "images/level2/scene1.jpg", hint: "场景一：科举高中后的喜悦。" },
            { id: 2, idiom: "画龙点睛", image: "images/level2/scene2.jpg", hint: "场景二：关键之处使整体生动。" },
            { id: 3, idiom: "锦上添花", image: "images/level2/scene3.jpg", hint: "场景三：美上加美。" },
            { id: 4, idiom: "胸有成竹", image: "images/level2/scene4.jpg", hint: "场景四：比喻事前已有准备。" }
        ],
        characters: shuffleArray("春风得意画龙点睛锦上添花胸有成竹".split(''))
    },
    // 可以添加更多关卡...
];

// 洗牌函数 (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}