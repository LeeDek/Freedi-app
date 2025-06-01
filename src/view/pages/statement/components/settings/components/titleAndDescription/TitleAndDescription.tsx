import React, { FC, useEffect, useRef, useState } from 'react';
import { StatementSettingsProps } from '../../settingsTypeHelpers';
import { useUserConfig } from '@/controllers/hooks/useUserConfig';
import './TitleAndDescription.scss';
import VisuallyHidden from '@/view/components/accessibility/toScreenReaders/VisuallyHidden';
import Button, { ButtonType } from '@/view/components/buttons/button/Button';
import { useNavigate } from 'react-router';
import { updateStatement } from '@/api/statements';
import { analyzeTextWithPerspective } from '@/services/perspective';

const TitleAndDescription: FC<StatementSettingsProps> = ({
	statement,
	setStatementToEdit,
}) => {
	const { t } = useUserConfig();
	const navigate = useNavigate();
	const titleInputRef = useRef<HTMLInputElement>(null);

	const arrayOfStatementParagraphs = statement?.statement.split('\n') || [];
	const originalTitle = arrayOfStatementParagraphs[0];

	const [title, setTitle] = useState(originalTitle);
	const [description, setDescription] = useState(statement.description || '');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, []);

	useEffect(() => {
		if (error) {
			console.warn("Moderation error:", error);
		}
	}, [error]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const fullText = `${title.trim()}\n${description.trim()}`;
		const updatedStatement = {
			...statement,
			statement: fullText,
			description,
		};

		const moderation = await analyzeTextWithPerspective(fullText);

		if (!moderation.passed) {
			setError(`⚠️ Inappropriate content detected: ${moderation.reason}`);
			setIsSubmitting(false);

			return;
		}

		// 🔄 Sync with local state
		setStatementToEdit(updatedStatement);

		try {
			await updateStatement(updatedStatement);
			navigate('/home');
		} catch (err) {
			console.error('Failed to update statement', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className='title-and-description' onSubmit={handleSubmit}>
			<label htmlFor='statement-title'>
				<VisuallyHidden labelName={t('Group Title')} />
				<input
					id='statement-title'
					data-cy='statement-title'
					ref={titleInputRef}
					type='text'
					name='statement'
					placeholder={t('Group Title')}
					value={title}
					onChange={(e) => {
						const newTitle = e.target.value;
						setTitle(newTitle);
						setError(null);
						setStatementToEdit({
							...statement,
							statement: `${newTitle}\n${description}`,
							description,
						});
					}}
					required
				/>
			</label>

			<label htmlFor='statement-description'>
				<VisuallyHidden labelName={t('Group Description')} />
				<textarea
					id='statement-description'
					name='description'
					placeholder={t('Group Description')}
					rows={3}
					value={description}
					onChange={(e) => {
						const newDescription = e.target.value;
						setDescription(newDescription);
						setStatementToEdit({
							...statement,
							statement: `${title}\n${newDescription}`,
							description: newDescription,
						});
					}}
				/>
			</label>
			{error && <p className="error-message" role="alert">{error}</p>}

			<div className='btns'>
				<Button
					text={t('Save')}
					aria-label='Submit button'
					data-cy='settings-statement-submit-btn'
					type='submit'
					disabled={isSubmitting}
				/>
				<Button
					text={t('Cancel')}
					type='button'
					buttonType={ButtonType.SECONDARY}
					aria-label='Cancel button'
					data-cy='settings-statement-cancel-btn'
					onClick={() => navigate('/home')}
				/>
			</div>
		</form>
	);
};

export default TitleAndDescription;
