import React, { FC, useEffect, useRef, useState } from 'react'; // ✅ Added useState to manage local form state
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

	// ✅ Split original title and description from statement
	const arrayOfStatementParagraphs = statement?.statement.split('\n') || [];
	const originalTitle = arrayOfStatementParagraphs[0];

	// ✅ Add state to control and update form fields
	const [title, setTitle] = useState(originalTitle);
	const [description, setDescription] = useState(statement.description || '');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// ✅ Focus title input on mount
	useEffect(() => {
		if (titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, []);

	// ✅ Submit handler to call the API and update state
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault(); // prevent page reload
		setError(null);
		setIsSubmitting(true);

		const fullText = `${title}\n${description}`;
		const moderation = await analyzeTextWithPerspective(fullText);

		if (!moderation.passed) {
			setError(`⚠️ Inappropriate content detected: ${moderation.reason}`);
			setIsSubmitting(false);

			return;
		}

		const updatedStatement = {
			...statement,
			statement: fullText,
			description,
		};

		try {
			await updateStatement(updatedStatement);     // ✅ Call API to persist changes
			setStatementToEdit(updatedStatement);        // ✅ Update app state
			navigate('/home');                           // ✅ Navigate back
		} catch (err) {
			console.error('Failed to update statement', err); // ✅ Handle setError('An error occurred while saving. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		// ✅ Wrap form with <form> and handle onSubmit
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
					value={title}                            // ✅ Controlled input
					onChange={(e) => setTitle(e.target.value)} // ✅ Update title state
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
					value={description}                      // ✅ Controlled input
					onChange={(e) => setDescription(e.target.value)} // ✅ Update description state
				/>
			</label>
			{error && (
				<p className="error-message" role="alert" style={{ color: 'red', marginTop: '0.5rem' }}>
					{error}
				</p>
			)}
			<div className='btns'>
				<Button
					text={t('Save')}
					aria-label='Submit button'
					data-cy='settings-statement-submit-btn'
					type='submit'                           // ✅ Triggers handleSubmit
					disabled={isSubmitting}
				/>
				<Button
					text={t('Cancel')}
					type='button'
					buttonType={ButtonType.SECONDARY}
					aria-label='Cancel button'
					data-cy='settings-statement-cancel-btn'
					onClick={() => navigate('/home')}       // ✅ Navigate back
				/>
			</div>
		</form>
	);
};

export default TitleAndDescription;
