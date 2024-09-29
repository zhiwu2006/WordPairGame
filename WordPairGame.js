import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import styles from '../styles/WordPairGame.module.css'

export default function WordPairGame() {
  const [score, setScore] = useState(0);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [result, setResult] = useState('');
  const [englishWords, setEnglishWords] = useState([]);
  const [chineseWords, setChineseWords] = useState([]);
  const [selectedEnglish, setSelectedEnglish] = useState(null);
  const [selectedChinese, setSelectedChinese] = useState(null);
  const [clickCounts, setClickCounts] = useState({});
  const [wordPairs, setWordPairs] = useState([
    ["backdrop", "背景"],
    ["overwhelmingly", "压倒性地"],
    ["philharmonic", "爱乐乐团"],
    // ... 其他初始单词对 ...
  ]);
  const fileInputRef = useRef(null);
  const [hintWord, setHintWord] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState(new Set());

  useEffect(() => {
    generateWords();
  }, [wordPairs]); // 添加 wordPairs 作为依赖项

  const generateWords = () => {
    const shuffledPairs = [...wordPairs].sort(() => Math.random() - 0.5);
    setEnglishWords(shuffledPairs.map(pair => pair[0]));
    setChineseWords(shuffledPairs.map(pair => pair[1]));
    setCurrentGroup(0);
    setScore(0);
    setResult('');
    setClickCounts({});
    setHintWord(null);
  };

  const getCurrentWords = useCallback(() => {
    const start = currentGroup * 10;
    const end = Math.min(start + 10, wordPairs.length);
    const currentPairs = wordPairs.slice(start, end);
    
    const currentEnglish = currentPairs.map(pair => pair[0]);
    const currentChinese = currentPairs.map(pair => pair[1]);
    
    // 随机打乱中文含义的顺序
    const shuffledChinese = [...currentChinese].sort(() => Math.random() - 0.5);
    
    return {
      english: currentEnglish,
      chinese: shuffledChinese
    };
  }, [currentGroup, wordPairs]);

  const { english: currentEnglishWords, chinese: currentChineseWords } = useMemo(() => getCurrentWords(), [getCurrentWords]);

  const selectWord = useCallback((word, isEnglish) => {
    if (isEnglish) {
      setSelectedEnglish(word);
      setClickCounts(prev => {
        const newCount = (prev[word] || 0) + 1;
        if (newCount === 3) {
          showHint(word);
        }
        return {...prev, [word]: newCount};
      });
    } else {
      setSelectedChinese(word);
    }
    
    if (isEnglish && selectedChinese) {
      checkMatch(word, selectedChinese);
    } else if (!isEnglish && selectedEnglish) {
      checkMatch(selectedEnglish, word);
    }
  }, [selectedEnglish, selectedChinese]);

  const showHint = (englishWord) => {
    setHintWord(englishWord);
    setTimeout(() => setHintWord(null), 3000); // 3秒后取消高亮
  };

  const checkMatch = useCallback((englishWord, chineseWord) => {
    const matchedPair = wordPairs.find(pair => pair[0] === englishWord && pair[1] === chineseWord);
    if (matchedPair) {
      setScore(prev => prev + 1);
      setMatchedPairs(prev => new Set(prev).add(englishWord));
      setSelectedEnglish(null);
      setSelectedChinese(null);
      checkGroupEnd();
    } else {
      setSelectedEnglish(null);
      setSelectedChinese(null);
    }
  }, [wordPairs]);

  const checkGroupEnd = () => {
    const start = currentGroup * 10;
    const end = Math.min(start + 10, englishWords.length);
    if (englishWords.slice(start, end).length === 0) {
      if (currentGroup === Math.ceil(wordPairs.length / 10) - 1) {
        endGame();
      } else {
        showNextGroup();
      }
    }
  };

  const endGame = () => {
    setResult(`恭喜你！你已经成功匹配了${score}个单词对！游戏结束！`);
  };

  const resetGame = () => {
    setScore(0);
    setResult('');
    setMatchedPairs(new Set());
    generateWords();
    // 强制重新计算 getCurrentWords
    setChineseWords(prev => [...prev]);
  };

  const showGroup = (groupIndex) => {
    const totalGroups = Math.ceil(wordPairs.length / 10);
    if (groupIndex >= 0 && groupIndex < totalGroups) {
      setCurrentGroup(groupIndex);
      setClickCounts({});
      // 强制重新计算 getCurrentWords
      setChineseWords(prev => [...prev]);
    }
  };

  const showNextGroup = () => showGroup(currentGroup + 1);
  const showPrevGroup = () => showGroup(currentGroup - 1);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          if (Array.isArray(json) && json.every(pair => Array.isArray(pair) && pair.length === 2)) {
            setWordPairs(json);
            // 移除这里的 generateWords 调用，因为它会在 useEffect 中自动调用
          } else {
            alert('JSON 格式不正确。请确保它是一个二维数组，每个内部数组包含两个元素。');
          }
        } catch (error) {
          alert('无法解析 JSON 文件。请检查文件格式。');
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.wordSection}>
        <h2>单词</h2>
        <div className={styles.wordGrid}>
          {currentEnglishWords.map((word, index) => (
            <Word 
              key={word} 
              word={word} 
              isSelected={selectedEnglish === word}
              isHint={hintWord === word}
              isMatched={matchedPairs.has(word)}
              onClick={() => !matchedPairs.has(word) && selectWord(word, true)}
            />
          ))}
        </div>
      </div>
      <div className={styles.wordSection}>
        <h2>中文注释</h2>
        <div className={styles.wordGrid}>
          {currentChineseWords.map((word, index) => (
            <Word 
              key={word} 
              word={word} 
              isSelected={selectedChinese === word}
              isHint={hintWord && wordPairs.find(pair => pair[0] === hintWord && pair[1] === word)}
              isMatched={wordPairs.some(pair => pair[1] === word && matchedPairs.has(pair[0]))}
              onClick={() => !wordPairs.some(pair => pair[1] === word && matchedPairs.has(pair[0])) && selectWord(word, false)}
            />
          ))}
        </div>
      </div>
      <div className={styles.gameInfo}>
        <div>得分：{score} / {wordPairs.length}</div>
        <div>当前组：{currentGroup + 1} / {Math.ceil(wordPairs.length / 10)}</div>
        <div>{result}</div>
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={showPrevGroup} disabled={currentGroup === 0} className={styles.button}>上一组</button>
        <button onClick={resetGame} className={styles.button}>重置游</button>
        <button onClick={showNextGroup} disabled={currentGroup === Math.ceil(wordPairs.length / 10) - 1} className={styles.button}>下一组</button>
        <button onClick={triggerFileInput} className={styles.button}>导入单词</button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept=".json"
        />
      </div>
    </div>
  )
}

const Word = React.memo(({ word, isSelected, isHint, isMatched, onClick }) => (
  <div 
    className={`${styles.word} 
      ${isSelected ? styles.selected : ''} 
      ${isHint ? styles.hint : ''}
      ${isMatched ? styles.matched : ''}`} 
    onClick={onClick}
  >
    {!isMatched && word}
  </div>
));