import Head from 'next/head'
import dynamic from 'next/dynamic'

// 使用动态导入来解决可能的服务器端渲染问题
const WordPairGame = dynamic(() => import('../components/WordPairGame'), { ssr: false })

export default function Home() {
  return (
    <div>
      <Head>
        <title>单词配对消除游戏</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <main>
        <h1>单词配对消除游戏</h1>
        <p>说明：点击左侧方框中的一个单词，然后点击右侧方框中你认为相对应的中文注释。如果配对正确，两个词条将会消失。尝试消除所有词条！如果一个单词被点击三次还未配对成功，将会显示提示。</p>
        <WordPairGame />
      </main>
    </div>
  )
}