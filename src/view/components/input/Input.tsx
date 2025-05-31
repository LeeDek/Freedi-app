import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import styles from './Input.module.scss';
import { useUserConfig } from '@/controllers/hooks/useUserConfig';
import CloseIcon from '@/assets/icons/close.svg?react';
import { analyzeTextWithPerspective } from '@/services/perspective';

interface SearchInputProps {
	label?: string;
	placeholder?: string;
	value?: string;
	image?: string;
	onChange?: (value: string) => void;
	backgroundColor?: string;
	name: string;
	autoFocus?: boolean;
	enableModeration?: boolean; // ✅ Optional moderation flag
	onModerationFail?: (reason: string) => void; // Optional external moderation error handler
}

const Input: React.FC<SearchInputProps> = ({
	label = 'Your name',
	placeholder = 'Search...',
	value = '',
	image,
	onChange,
	backgroundColor = '#fff',
	name,
	autoFocus = false,
	enableModeration = false,
	onModerationFail,
}) => {
	const { dir } = useUserConfig();
	const [inputValue, setInputValue] = useState<string>(value);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
		const val = e.target.value;
		setInputValue(val);
		setError(null);
		onChange?.(val);
	};

	const handleClear = (): void => {
		setInputValue('');
		setError(null);
		onChange?.('');
	};
	const handleBlur = async () => {
		if (!enableModeration || !inputValue.trim()) return;

		const moderation = await analyzeTextWithPerspective(inputValue);

		if (!moderation.passed) {
			setError(`⚠️ ${moderation.reason}`);
			onModerationFail?.(moderation.reason);
		}
	};

	useEffect(() => {
		if (autoFocus && inputRef.current) {
			inputRef.current.focus();
		}
	}, [autoFocus]);

	return (
		<div className={styles.container}>
			<div
				className={`${styles.label} ${dir === 'ltr' ? styles['label--ltr'] : styles['label--rtl']
					}`}
				style={{ backgroundColor: backgroundColor }}
			>
				{label}
			</div>
			<div className={styles.inputContainer}>
				{image && (
					<img
						src={image}
						alt='search'
						className={styles.searchIcon}
						width={24}
						height={24}
					/>
				)}
				<input
					ref={inputRef}
					name={name}
					type='text'
					value={inputValue}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder={placeholder}
					className={styles.input}
					autoFocus={autoFocus}
					aria-invalid={!!error}
				/>
				{inputValue && (
					<button
						onClick={handleClear}
						className={styles.clearButton}
						type='button'
						aria-label='Clear input'
					>
						<CloseIcon />
					</button>
				)}
			</div>
			{error && <p className={styles.errorMessage} role='alert'>{error}</p>}

		</div>
	);
};

export default Input;
