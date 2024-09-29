import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper, 
  ThemeProvider, 
  createTheme, 
  Chip
} from '@mui/material';
import { styled } from '@mui/system';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // 深蓝色
    },
    secondary: {
      main: '#f50057', // 粉红色
    },
    background: {
      default: '#f5f5f5', // 浅灰色背景
    },
  },
  typography: {
    fontSize: 18, // 基础字体大小
    h5: {
      fontSize: '2rem', // 标题字体大小
    },
  },
});

const WordCard = styled(Paper)(({ theme, isSelected, isHint, isMatched }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: isMatched ? 'default' : 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isMatched ? 'transparent' : 
                  isHint ? theme.palette.warning.light : 
                  isSelected ? theme.palette.action.selected : 
                  theme.palette.background.paper,
  boxShadow: isMatched ? 'none' : theme.shadows[1],
  border: isMatched ? 'none' : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: isMatched ? 'none' : 'translateY(-2px)',
    boxShadow: isMatched ? 'none' : theme.shadows[4],
  },
  minHeight: theme.spacing(10), // 设置最小高度
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
}));

const StyledButton = styled(Button)(({ theme, clicked }) => ({
  boxShadow: clicked ? 'none !important' : theme.shadows[2],
  '&:hover': {
    boxShadow: clicked ? 'none !important' : theme.shadows[4],
  },
  '&:active': {
    boxShadow: 'none !important',
  },
  '&:focus': {
    boxShadow: clicked ? 'none !important' : theme.shadows[2],
  },
}));

const ScoreBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
}));

const UnfamiliarWordsBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(4),
}));

const UnfamiliarWordChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: '#e8f5e9', // 浅绿色背景
  color: theme.palette.getContrastText('#e8f5e9'), // 自动选择对比色
  fontSize: '1.2rem', // 增加字体大小
  '&:hover': {
    backgroundColor: '#c8e6c9', // 悬停时稍微深一点的绿色
  },
}));

const SectionBox = styled(Box)(({ theme, isEnglish }) => ({
  backgroundColor: isEnglish ? '#e3f2fd' : '#fce4ec',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${isEnglish ? theme.palette.primary.light : theme.palette.secondary.light}`,
  height: 'auto', // 改为自适应高度
  minHeight: '400px', // 设置最小高度
  display: 'flex',
  flexDirection: 'column',
}));

function WordPairGame() {
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
  const [matchStats, setMatchStats] = useState({ oneClick: 0, twoClicks: 0, unfamiliar: 0 });
  const [buttonClicked, setButtonClicked] = useState({
    prev: false,
    reset: false,
    next: false,
    import: false
  });
  const [unfamiliarWords, setUnfamiliarWords] = useState([]);

  useEffect(() => {
    generateWords();
  }, [wordPairs]);

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
    
    // 确保中文词组的数量与英文词组完全相同
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
          setUnfamiliarWords(prevWords => {
            const chineseWord = wordPairs.find(pair => pair[0] === word)[1];
            // 检查单词是否已经存在于不熟悉单词列表中
            if (!prevWords.some(w => w.english === word)) {
              return [...prevWords, { english: word, chinese: chineseWord }];
            }
            return prevWords;
          });
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
  }, [selectedEnglish, selectedChinese, wordPairs]);

  const showHint = (englishWord) => {
    setHintWord(englishWord);
    setTimeout(() => setHintWord(null), 3000);
  };

  const checkMatch = useCallback((englishWord, chineseWord) => {
    const matchedPair = wordPairs.find(pair => pair[0] === englishWord && pair[1] === chineseWord);
    if (matchedPair) {
      setScore(prev => prev + 1);
      setMatchedPairs(prev => new Set(prev).add(englishWord));
      
      // 更新匹配统计
      const clickCount = clickCounts[englishWord] || 0;
      setMatchStats(prev => ({
        ...prev,
        oneClick: clickCount === 1 ? prev.oneClick + 1 : prev.oneClick,
        twoClicks: clickCount === 2 ? prev.twoClicks + 1 : prev.twoClicks,
        unfamiliar: clickCount >= 3 ? prev.unfamiliar + 1 : prev.unfamiliar,
      }));

      setSelectedEnglish(null);
      setSelectedChinese(null);
      checkGroupEnd();
    } else {
      setSelectedEnglish(null);
      setSelectedChinese(null);
    }
  }, [wordPairs, clickCounts]);

  const checkGroupEnd = () => {
    const start = currentGroup * 10;
    const end = Math.min(start + 10, wordPairs.length);
    const currentGroupWords = wordPairs.slice(start, end);
    const allMatched = currentGroupWords.every(pair => matchedPairs.has(pair[0]));

    if (allMatched) {
      if (currentGroup === Math.ceil(wordPairs.length / 10) - 1) {
        endGame();
      } else {
        showNextGroup();
      }
    }
  };

  const endGame = () => {
    const totalMatched = matchStats.oneClick + matchStats.twoClicks + matchStats.unfamiliar;
    setResult(`
      恭喜你！游戏结束！
      总共匹配了 ${totalMatched} 个单词对。
      一次点击正确：${matchStats.oneClick} 个
      两次点击正确：${matchStats.twoClicks} 个
      不熟悉的单词（三次或以上点）：${matchStats.unfamiliar} 个
    `);
    console.log("Game ended. Result:", result); // 添加这行来调试
  };

  const resetGame = () => {
    setScore(0);
    setResult('');
    setMatchedPairs(new Set());
    setMatchStats({ oneClick: 0, twoClicks: 0, unfamiliar: 0 });
    generateWords();
    setChineseWords(prev => [...prev]);
    setButtonClicked({
      prev: false,
      reset: true,
      next: false,
      import: false
    });
    // 添加一个延时来重置重置按钮的状态
    setTimeout(() => {
      setButtonClicked(prev => ({...prev, reset: false}));
    }, 300);
  };

  const showGroup = (groupIndex) => {
    const totalGroups = Math.ceil(wordPairs.length / 10);
    if (groupIndex >= 0 && groupIndex < totalGroups) {
      setCurrentGroup(groupIndex);
      setClickCounts({});
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
            // 随机打乱导入的单词对
            const shuffledPairs = [...json].sort(() => Math.random() - 0.5);
            setWordPairs(shuffledPairs);
            setUnfamiliarWords([]); // 重置不熟悉的单词列表
            resetGame(); // 重置游戏状态
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

  const handleButtonClick = (buttonName) => {
    setButtonClicked(prev => ({...prev, [buttonName]: true}));
    setTimeout(() => {
      setButtonClicked(prev => ({...prev, [buttonName]: false}));
    }, 300); // 增加到 300 毫秒
  };

  return (
    <ThemeProvider theme={theme}>
      <Container 
        maxWidth={false} 
        sx={{ 
          width: '80%', 
          margin: '0 auto',
          '@media (max-width:600px)': {
            width: '95%', // 在小屏幕上使用更大的宽度
          },
        }}
      >
        <Box my={4}>
          <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
            单词配对游戏
          </Typography>
          <Typography variant="body1" paragraph align="center">
            通过点击匹配英文单词和中文释义来提高你的词汇量。每组包含10个单词，连续点击同一个单词3次可以获得提示。
          </Typography>
          
          <ScoreBox display="flex" justifyContent="space-around" alignItems="center">
            <Typography variant="h5">得分：{score} / {wordPairs.length}</Typography>
            <Typography variant="h5">当前组：{currentGroup + 1} / {Math.ceil(wordPairs.length / 10)}</Typography>
          </ScoreBox>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SectionBox isEnglish>
                <Typography variant="h5" gutterBottom color="primary">英文单词</Typography>
                <Grid container spacing={1}>
                  {currentEnglishWords.map((word, index) => (
                    <Grid item xs={6} key={index}>
                      <WordCard 
                        isSelected={selectedEnglish === word}
                        isHint={hintWord === word}
                        isMatched={matchedPairs.has(word)}
                        onClick={() => !matchedPairs.has(word) && selectWord(word, true)}
                      >
                        {!matchedPairs.has(word) ? word : ' '}
                      </WordCard>
                    </Grid>
                  ))}
                </Grid>
              </SectionBox>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <SectionBox>
                <Typography variant="h5" gutterBottom color="secondary">中文释义</Typography>
                <Grid container spacing={1}>
                  {currentChineseWords.map((word, index) => (
                    <Grid item xs={6} key={index}>
                      <WordCard 
                        isSelected={selectedChinese === word}
                        isHint={hintWord && wordPairs.find(pair => pair[0] === hintWord && pair[1] === word)}
                        isMatched={wordPairs.some(pair => pair[1] === word && matchedPairs.has(pair[0]))}
                        onClick={() => !wordPairs.some(pair => pair[1] === word && matchedPairs.has(pair[0])) && selectWord(word, false)}
                      >
                        {!wordPairs.some(pair => pair[1] === word && matchedPairs.has(pair[0])) ? word : ' '}
                      </WordCard>
                    </Grid>
                  ))}
                </Grid>
              </SectionBox>
            </Grid>
          </Grid>
          
          <Box my={4}>
            <Typography variant="body1" style={{ whiteSpace: 'pre-line', marginTop: '20px' }}>{result}</Typography>
          </Box>
          
          <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2}>
            <StyledButton 
              variant="contained" 
              color="primary"
              onClick={() => {
                handleButtonClick('prev');
                showPrevGroup();
              }} 
              disabled={currentGroup === 0}
              clicked={buttonClicked.prev.toString()}
            >
              上一组
            </StyledButton>
            <StyledButton 
              variant="contained" 
              color="secondary"
              onClick={() => {
                handleButtonClick('reset');
                resetGame();
              }}
              clicked={buttonClicked.reset.toString()}
            >
              重置游戏
            </StyledButton>
            <StyledButton 
              variant="contained" 
              color="primary"
              onClick={() => {
                handleButtonClick('next');
                showNextGroup();
              }} 
              disabled={currentGroup === Math.ceil(wordPairs.length / 10) - 1}
              clicked={buttonClicked.next.toString()}
            >
              下一组
            </StyledButton>
            <StyledButton 
              variant="contained" 
              color="secondary"
              onClick={() => {
                handleButtonClick('import');
                triggerFileInput();
              }}
              clicked={buttonClicked.import.toString()}
            >
              导入单词
            </StyledButton>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".json"
            />
          </Box>
          
          <UnfamiliarWordsBox>
            <Typography variant="h6" gutterBottom color="primary">
              不熟悉的单词（3次或以上点击）：
            </Typography>
            <Grid container spacing={1}>
              {unfamiliarWords.map((word, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={word.english}>
                  <UnfamiliarWordChip
                    label={`${word.english} - ${word.chinese}`}
                    title={`点击次数：${clickCounts[word.english]}`}
                  />
                </Grid>
              ))}
            </Grid>
          </UnfamiliarWordsBox>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default WordPairGame;