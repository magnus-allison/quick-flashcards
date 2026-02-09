'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import pako from 'pako';
import { LightbulbFilament, Shuffle, Star, Translate } from '@phosphor-icons/react';

type WordItem = Record<string, string>;

type Wordlist = {
	name: string;
	words: WordItem[];
};

type LanguageData = {
	flag: string;
	translationKey: string;
	wordlists: Wordlist[];
};

type TooltipProps = {
	label: string;
	children: ReactNode;
};

function Tooltip({ label, children }: TooltipProps) {
	return (
		<span className='relative inline-flex items-center group'>
			{children}
			<span className='pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#2a2a2a] bg-[#0b0b0b] px-2 py-1 text-[10px] tracking-[1px] text-[#bdbdbd] opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				{label}
			</span>
		</span>
	);
}

const languageFlags: Record<string, string> = {
	es: '🇪🇸',
	de: '🇩🇪',
	fr: '🇫🇷'
};

function loadAllLanguages(): Record<string, LanguageData> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ctx = (require as any).context('../wordlist', true, /^\.\/[^/]+\/(?!index)[^/]+\.ts$/);
	const languages: Record<string, LanguageData> = {};

	for (const key of ctx.keys() as string[]) {
		const [, lang, file] = key.match(/^\.\/([^/]+)\/([^/]+)\.ts$/) ?? [];
		if (!lang || !file) continue;

		const mod = ctx(key);
		const words: WordItem[] = mod[Object.keys(mod)[0]];
		let name = file.charAt(0).toUpperCase() + file.slice(1);

		if (name.includes('_')) {
			name = name
				.split('_')
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(' ');
		}

		if (!languages[lang]) {
			const translationKey =
				Object.keys(words[0] ?? {}).find((k) => k !== 'image' && k !== 'english') ?? '';
			languages[lang] = {
				flag: languageFlags[lang] ?? '🏳️',
				translationKey,
				wordlists: []
			};
		}

		languages[lang].wordlists.push({ name, words });
	}

	for (const lang of Object.values(languages)) {
		lang.wordlists.sort((a, b) => a.name.localeCompare(b.name));
	}

	return languages;
}

const allLanguages = loadAllLanguages();
const languageCodes = Object.keys(allLanguages).sort();
const defaultLanguage = languageCodes.includes('es') ? 'es' : languageCodes[0];

export default function Home() {
	const [language, setLanguage] = useState(defaultLanguage);
	const [selectedList, setSelectedList] = useState(0);
	const [currentCard, setCurrentCard] = useState(0);
	const [revealState, setRevealState] = useState<'front' | 'hint' | 'back'>('front');
	const [shuffledLists, setShuffledLists] = useState<Record<string, Wordlist[]>>({});
	const [isAllCards, setIsAllCards] = useState(false);
	const [isFavorites, setIsFavorites] = useState(false);
	const [allCardsByLanguage, setAllCardsByLanguage] = useState<Record<string, WordItem[]>>({});
	const [favoritesByLanguage, setFavoritesByLanguage] = useState<Record<string, string[]>>({});
	const [shuffledFavoritesByLanguage, setShuffledFavoritesByLanguage] = useState<
		Record<string, WordItem[]>
	>({});
	const [shuffleEnabled, setShuffleEnabled] = useState(false);
	const [hintEnabled, setHintEnabled] = useState(false);
	const [foreignFirst, setForeignFirst] = useState(false);

	const langData = allLanguages[language];
	const translationKey = langData?.translationKey ?? '';
	const baseWordlists = langData?.wordlists ?? [];
	const wordlists = baseWordlists.map((list, index) => {
		const shuffledList = shuffledLists[language]?.[index];
		return shuffleEnabled && shuffledList ? shuffledList : list;
	});
	const combinedBaseWords = baseWordlists.flatMap((list) => list.words);
	const combinedWords =
		(shuffleEnabled ? allCardsByLanguage[language] : undefined) ?? combinedBaseWords ?? [];
	const allCardsList: Wordlist = { name: 'All Cards', words: combinedWords };
	const favoriteKeys = favoritesByLanguage[language] ?? [];
	const favoriteKeySet = useMemo(() => new Set(favoriteKeys), [favoriteKeys]);
	const favoriteBaseWords = useMemo(
		() =>
			combinedBaseWords.filter((item) =>
				favoriteKeySet.has(`${item.english}||${item[translationKey] ?? ''}`)
			),
		[combinedBaseWords, favoriteKeySet, translationKey]
	);
	const favoritesWords =
		(shuffleEnabled ? shuffledFavoritesByLanguage[language] : undefined) ?? favoriteBaseWords ?? [];
	const favoritesList: Wordlist = { name: 'Favorites', words: favoritesWords };
	const currentList = isFavorites ? favoritesList : isAllCards ? allCardsList : wordlists[selectedList];
	const currentWords = currentList?.words ?? [];
	const hasWords = currentWords.length > 0;
	const card = hasWords ? currentWords[currentCard] : null;
	const masteryPercent = hasWords ? Math.round((currentCard / currentWords.length) * 100) : 0;
	const isHint = revealState === 'hint';
	const isBack = revealState === 'back';
	const frontText = card ? (foreignFirst ? card[translationKey] : card.english) : '';
	const backText = card ? (foreignFirst ? card.english : card[translationKey]) : '';

	const shuffleArray = useCallback((items: WordItem[]) => [...items].sort(() => Math.random() - 0.5), []);
	const getHintText = useCallback(() => {
		const raw = `${backText ?? ''}`.trim();
		if (!raw) return '';
		const parts = raw.split(/\s+/);
		const articleCandidates = [
			'el',
			'la',
			'los',
			'las',
			'un',
			'una',
			'der',
			'die',
			'das',
			'ein',
			'eine',
			'le',
			'la',
			'les',
			'un',
			'une'
		];
		const firstPart = parts[0]?.toLowerCase();
		const hasArticle = firstPart && articleCandidates.includes(firstPart);
		const article = hasArticle ? parts[0] : '';
		const word = hasArticle ? parts.slice(1).join(' ') : raw;
		const cleaned = word.replace(/[^a-zA-ZÀ-ÿ]/g, '');
		if (!cleaned) return article ? `${article} —` : '—';
		if (cleaned.length <= 2) return article ? `${article} ${cleaned}` : cleaned;
		const first = cleaned.charAt(0);
		const last = cleaned.charAt(cleaned.length - 1);
		const middle = '_'.repeat(Math.max(cleaned.length - 2, 0));
		const masked = `${first}${middle}${last}`;
		return article ? `${article} ${masked}` : masked;
	}, [backText]);

	useEffect(() => {
		if (!shuffleEnabled || baseWordlists.length === 0) return;
		if (isAllCards) {
			if (!allCardsByLanguage[language]) {
				setAllCardsByLanguage((prev) => ({
					...prev,
					[language]: shuffleArray(combinedBaseWords)
				}));
			}
			return;
		}
		if (isFavorites) {
			if (!shuffledFavoritesByLanguage[language]) {
				setShuffledFavoritesByLanguage((prev) => ({
					...prev,
					[language]: shuffleArray(favoriteBaseWords)
				}));
			}
			return;
		}

		const hasShuffled = Boolean(shuffledLists[language]?.[selectedList]);
		if (!hasShuffled && baseWordlists[selectedList]) {
			setShuffledLists((prev) => {
				const next = { ...prev };
				const nextLists = baseWordlists.map((list, index) => prev[language]?.[index] ?? list);
				nextLists[selectedList] = {
					...baseWordlists[selectedList],
					words: shuffleArray(baseWordlists[selectedList].words)
				};
				next[language] = nextLists;
				return next;
			});
		}
	}, [
		shuffleEnabled,
		isAllCards,
		isFavorites,
		language,
		selectedList,
		baseWordlists,
		combinedBaseWords,
		favoriteBaseWords,
		allCardsByLanguage,
		shuffledFavoritesByLanguage,
		shuffledLists,
		shuffleArray
	]);

	useEffect(() => {
		if (!shuffleEnabled || !isFavorites) return;
		setShuffledFavoritesByLanguage((prev) => ({
			...prev,
			[language]: shuffleArray(favoriteBaseWords)
		}));
	}, [favoriteBaseWords, isFavorites, language, shuffleArray, shuffleEnabled]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const stored = window.localStorage.getItem('quick-flashcards:favorites.v1');
		if (!stored) return;
		try {
			const json = pako.inflate(atob(stored), { to: 'string' }) as string;
			const parsed = JSON.parse(json) as Record<string, string[]>;
			setFavoritesByLanguage(parsed);
		} catch {}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const json = JSON.stringify(favoritesByLanguage);
			const compressed = pako.deflate(json, { to: 'string' }) as string;
			window.localStorage.setItem('quick-flashcards:favorites.v1', btoa(compressed));
		} catch {}
	}, [favoritesByLanguage]);

	const handleCardClick = () => {
		if (!hasWords) return;
		if (!hintEnabled) {
			setRevealState((prev) => (prev === 'back' ? 'front' : 'back'));
			return;
		}
		setRevealState((prev) => {
			if (prev === 'front') return 'hint';
			if (prev === 'hint') return 'back';
			return 'front';
		});
	};

	const handleKeyAction = useCallback(
		(key: string, code: string, preventDefault: () => void) => {
			if (!hasWords) return;
			if (
				code === 'Space' ||
				key === ' ' ||
				code === 'Enter' ||
				code === 'NumpadEnter' ||
				key === 'Enter'
			) {
				preventDefault();
				if (!hintEnabled) {
					setRevealState((prev) => (prev === 'back' ? 'front' : 'back'));
					return;
				}
				setRevealState((prev) => {
					if (prev === 'front') return 'hint';
					if (prev === 'hint') return 'back';
					return 'front';
				});
				return;
			}
			if (code === 'ArrowRight' || key === 'ArrowRight') {
				preventDefault();
				setRevealState('front');
				setCurrentCard((prev) => (prev + 1) % currentWords.length);
				return;
			}
			if (code === 'ArrowLeft' || key === 'ArrowLeft') {
				preventDefault();
				setRevealState('front');
				setCurrentCard((prev) => (prev - 1 + currentWords.length) % currentWords.length);
			}
		},
		[hasWords, currentWords.length, hintEnabled]
	);

	const nextCard = () => {
		if (!hasWords) return;
		setRevealState('front');
		setCurrentCard((prev) => (prev + 1) % currentWords.length);
	};

	const prevCard = () => {
		if (!hasWords) return;
		setRevealState('front');
		setCurrentCard((prev) => (prev - 1 + currentWords.length) % currentWords.length);
	};

	const handleListChange = (index: number) => {
		setIsAllCards(false);
		setIsFavorites(false);
		setSelectedList(index);
		setCurrentCard(0);
		setRevealState('front');
	};

	const handleAllCards = () => {
		setIsAllCards(true);
		setIsFavorites(false);
		setSelectedList(-1);
		setCurrentCard(0);
		setRevealState('front');
	};

	const handleFavorites = () => {
		setIsFavorites(true);
		setIsAllCards(false);
		setSelectedList(-1);
		setCurrentCard(0);
		setRevealState('front');
	};

	const handleLanguageChange = (nextLanguage: string) => {
		setLanguage(nextLanguage);
		setIsAllCards(false);
		setIsFavorites(false);
		setSelectedList(0);
		setCurrentCard(0);
		setRevealState('front');
	};

	const toggleShuffle = () => {
		setShuffleEnabled((prev) => {
			const next = !prev;
			if (next) {
				if (isFavorites) {
					setShuffledFavoritesByLanguage((current) => ({
						...current,
						[language]: shuffleArray(favoriteBaseWords)
					}));
				} else if (isAllCards) {
					setAllCardsByLanguage((current) => ({
						...current,
						[language]: shuffleArray(combinedBaseWords)
					}));
				} else if (baseWordlists[selectedList]) {
					setShuffledLists((current) => {
						const nextLists = baseWordlists.map(
							(list, index) => current[language]?.[index] ?? list
						);
						nextLists[selectedList] = {
							...baseWordlists[selectedList],
							words: shuffleArray(baseWordlists[selectedList].words)
						};
						return { ...current, [language]: nextLists };
					});
				}
				setCurrentCard(0);
				setRevealState('front');
			}
			return next;
		});
	};

	const toggleFavorite = () => {
		if (!card) return;
		const key = `${card.english}||${card[translationKey] ?? ''}`;
		setFavoritesByLanguage((prev) => {
			const current = new Set(prev[language] ?? []);
			if (current.has(key)) {
				current.delete(key);
			} else {
				current.add(key);
			}
			return { ...prev, [language]: Array.from(current) };
		});
	};

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const tagName = target?.tagName?.toLowerCase();
			if (
				target?.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			) {
				return;
			}
			handleKeyAction(e.key, e.code, () => e.preventDefault());
		};

		document.addEventListener('keydown', handleKeyPress);
		return () => document.removeEventListener('keydown', handleKeyPress);
	}, [handleKeyAction]);

	return (
		<div className='flex min-h-screen bg-[#070707]'>
			{/* Sidebar */}
			<aside className='w-60 bg-[#0b0b0b] border-r border-[#2a2a2a] p-5 flex flex-col'>
				<div>
					<div className='flex items-center justify-between mb-4'>
						<span className='text-[11px] uppercase tracking-[2px] text-[#666]'>Wordlists</span>
					</div>
					<ul className='space-y-0.5'>
						<li>
							<button
								onClick={handleAllCards}
								tabIndex={-1}
								className={`w-full text-left px-3 py-2 text-[13px] ${
									isAllCards
										? 'bg-[#151515] text-[#e0e0e0] border-l-2 border-[#4a4a4a]'
										: 'text-[#777] hover:bg-[#111] hover:text-[#e0e0e0] border-l-2 border-transparent'
								}`}
							>
								All Cards
							</button>
						</li>
						<li className='pb-2 mb-2 border-b border-[#1c1c1c]'>
							<button
								onClick={handleFavorites}
								tabIndex={-1}
								className={`w-full text-left px-3 py-2 text-[13px] ${
									isFavorites
										? 'bg-[#151515] text-[#e0e0e0] border-l-2 border-[#4a4a4a]'
										: 'text-[#777] hover:bg-[#111] hover:text-[#e0e0e0] border-l-2 border-transparent'
								}`}
							>
								Favourites
							</button>
						</li>
						{wordlists.map((list, index) => (
							<li key={index}>
								<button
									onClick={() => handleListChange(index)}
									tabIndex={-1}
									className={`w-full text-left px-3 py-2 text-[13px] ${
										!isAllCards && !isFavorites && selectedList === index
											? 'bg-[#151515] text-[#e0e0e0] border-l-2 border-[#4a4a4a]'
											: 'text-[#777] hover:bg-[#111] hover:text-[#e0e0e0] border-l-2 border-transparent'
									}`}
								>
									{list.name}
								</button>
							</li>
						))}
					</ul>
				</div>

				<div className='mt-auto pt-5 border-t border-[#1c1c1c]'>
					<span className='text-[11px] uppercase tracking-[2px] text-[#666]'>Language</span>
					<div className='mt-3 flex gap-2 flex-wrap'>
						{languageCodes.map((code) => (
							<button
								key={code}
								onClick={() => handleLanguageChange(code)}
								tabIndex={-1}
								className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 border text-[13px] ${
									language === code
										? 'bg-[#151515] text-[#e0e0e0] border-[#4a4a4a]'
										: 'bg-[#0b0b0b] text-[#777] border-[#2a2a2a] hover:bg-[#111] hover:text-[#e0e0e0]'
								}`}
								aria-pressed={language === code}
							>
								<span aria-hidden='true'>{allLanguages[code].flag}</span>
								<span>{code.toUpperCase()}</span>
							</button>
						))}
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main className='flex-1 flex flex-col items-center justify-center p-8'>
				<div className='text-center mb-8'>
					<h1 className='text-[15px] text-[#e0e0e0] mb-1'>{currentList?.name ?? 'Loading...'}</h1>
					<p className='text-[#4a4a4a] text-[12px]'>
						{hasWords ? currentCard + 1 : 0} / {currentWords.length}
					</p>
					<div className='mt-4 w-80'>
						<div className='flex items-center justify-between text-[11px] uppercase tracking-[2px] text-[#4a4a4a]'>
							<span>Progress</span>
							<span>{masteryPercent}%</span>
						</div>
						<div className='mt-2 h-[6px] bg-[#0f0f0f] border border-[#232323]'>
							<div
								className='h-full bg-[#3ddc84] transition-all'
								style={{ width: `${masteryPercent}%` }}
							/>
						</div>
						<div className='mt-2 flex items-center justify-between text-[11px] text-[#5a5a5a]'>
							<span>0</span>
							<span>{currentWords.length}</span>
						</div>
						<div className='mt-3 flex items-center justify-center gap-2'>
							<Tooltip label='Shuffle cards'>
								<button
									onClick={toggleShuffle}
									tabIndex={-1}
									className={`p-1 hover:text-[#e0e0e0] disabled:opacity-30 ${
										shuffleEnabled ? 'text-[#e0e0e0]' : 'text-[#4a4a4a]'
									}`}
									disabled={!hasWords}
									aria-label='Shuffle cards'
									title='Shuffle cards'
								>
									<Shuffle size={14} weight='regular' />
								</button>
							</Tooltip>
							<Tooltip label='Toggle favorite'>
								<button
									onClick={toggleFavorite}
									tabIndex={-1}
									className={`p-1 hover:text-[#e0e0e0] disabled:opacity-30 ${
										card &&
										favoriteKeySet.has(`${card.english}||${card[translationKey] ?? ''}`)
											? 'text-[#e0e0e0]'
											: 'text-[#4a4a4a]'
									}`}
									disabled={!hasWords}
									aria-label='Toggle favorite'
									title='Toggle favorite'
								>
									<Star size={14} weight='regular' />
								</button>
							</Tooltip>
							<Tooltip label='Toggle hints'>
								<button
									onClick={() =>
										setHintEnabled((prev) => {
											const next = !prev;
											if (!next) setRevealState('front');
											return next;
										})
									}
									tabIndex={-1}
									className={`p-1 hover:text-[#e0e0e0] ${
										hintEnabled ? 'text-[#e0e0e0]' : 'text-[#4a4a4a]'
									}`}
									disabled={!hasWords}
									aria-label='Toggle hints'
									title='Toggle hints'
								>
									<LightbulbFilament size={12} weight='regular' />
								</button>
							</Tooltip>
							<Tooltip label='Foreign first'>
								<button
									onClick={() => setForeignFirst((prev) => !prev)}
									tabIndex={-1}
									className={`p-1 hover:text-[#e0e0e0] ${
										foreignFirst ? 'text-[#e0e0e0]' : 'text-[#4a4a4a]'
									}`}
									disabled={!hasWords}
									aria-label='Toggle foreign-first'
									title='Toggle foreign-first'
								>
									<Translate size={12} weight='regular' />
								</button>
							</Tooltip>
						</div>
					</div>
				</div>

				{/* Flashcard */}
				<div
					tabIndex={-1}
					onClick={handleCardClick}
					className='relative w-102 h-64 bg-[#0b0b0b] border border-[#2a2a2a] flex items-center justify-center cursor-pointer hover:bg-[#101010] hover:border-[#333] mb-8 select-none outline-none'
				>
					{isBack && (
						<div className='absolute top-4 right-4 w-2.5 h-2.5 bg-[#3ddc84] rounded-full shadow-[0_0_0_2px_#111]' />
					)}
					{isHint && (
						<div className='absolute top-4 right-4 w-2.5 h-2.5 bg-[#f4a742] rounded-full shadow-[0_0_0_2px_#111]' />
					)}
					<p className='text-2xl text-[#e0e0e0]'>
						{card ? (isHint ? getHintText() : isBack ? backText : frontText) : '...'}
					</p>
				</div>

				{/* Navigation Buttons */}
				<div className='flex gap-3'>
					<button
						onClick={prevCard}
						tabIndex={-1}
						className='px-4 py-2.5 bg-[#151515] text-[#e0e0e0] border border-[#2a2a2a] hover:bg-[#1f1f1f] hover:border-[#333] disabled:opacity-30 text-[13px] select-none outline-none'
						disabled={!hasWords}
					>
						Previous
					</button>
					<button
						onClick={nextCard}
						tabIndex={-1}
						className='px-4 py-2.5 bg-[#151515] text-[#e0e0e0] border border-[#2a2a2a] hover:bg-[#1f1f1f] hover:border-[#333] disabled:opacity-30 text-[13px] select-none outline-none'
						disabled={!hasWords}
					>
						Next
					</button>
				</div>
			</main>
		</div>
	);
}
