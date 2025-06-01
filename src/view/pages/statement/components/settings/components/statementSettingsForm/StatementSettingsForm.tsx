import { Dispatch, FC, FormEvent, useState } from 'react';

// Third party imports
import { useNavigate, useParams } from 'react-router';

// Firestore functions

// Custom components
import QuestionSettings from '../QuestionSettings/QuestionSettings';
import AdvancedSettings from './../../components/advancedSettings/AdvancedSettings';
import ChoseBySettings from '../choseBy/ChoseBySettings';
import GetEvaluators from './../../components/GetEvaluators';
import GetVoters from './../../components/GetVoters';
import SectionTitle from './../../components/sectionTitle/SectionTitle';
import TitleAndDescription from './../../components/titleAndDescription/TitleAndDescription';
import { setNewStatement } from './../../statementSettingsCont';
import { useUserConfig } from '@/controllers/hooks/useUserConfig';
import UploadImage from '@/view/components/uploadImage/UploadImage';

// Hooks & Helpers
import './StatementSettingsForm.scss';

// icons
import { useAppSelector } from '@/controllers/hooks/reduxHooks';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/redux/store';
import Loader from '@/view/components/loaders/Loader';
import { StatementSubscription, Role, Statement, StatementType } from 'delib-npm';
import MembershipSettings from '../membershipSettings/MembershipSettings';
import { analyzeTextWithPerspective } from '@/services/perspective';

interface StatementSettingsFormProps {
	statement: Statement;
	parentStatement?: Statement | 'top';
	setStatementToEdit: Dispatch<Statement>;
}

const StatementSettingsForm: FC<StatementSettingsFormProps> = ({
	statement,
	parentStatement,
	setStatementToEdit,
}) => {
	const imageUrl = statement.imagesURL?.main ?? '';

	// * Hooks * //
	const navigate = useNavigate();
	const { statementId } = useParams();
	const { t } = useUserConfig();

	const [image, setImage] = useState<string>(imageUrl);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Selector to get the statement memberships
	const statementMembershipSelector = (statementId: string | undefined) =>
		createSelector(
			(state: RootState) => state.statements.statementMembership,
			(memberships) =>
				memberships.filter(
					(membership: StatementSubscription) =>
						membership.statementId === statementId
				)
		);

	const members: StatementSubscription[] = useAppSelector(
		statementMembershipSelector(statementId)
	);

	const joinedMembers = members
		.filter((member) => member.role !== Role.banned)
		.map((m) => m.user);

	// * Functions * //
	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			// Check for toxic content before submitting
			const moderation = await analyzeTextWithPerspective(statement.description ?? '');
			if (!moderation.passed) {
				setError(
					`The description contains inappropriate language: ${moderation.reason}. Please revise it.`
				);
				setLoading(false);

				return;
			}

			const newStatement = await setNewStatement({
				navigate,
				statementId,
				statement,
				parentStatement,
			});

			setLoading(false);
			if (!newStatement) throw new Error('No new statement');
			navigate(`/statement/${newStatement.statementId}`);
		} catch (err) {
			setLoading(false);
			setError('Something went wrong while saving the statement.');
			console.error(err);
		}
	};

	const isNewStatement = !statementId;

	const statementSettingsProps = {
		statement,
		setStatementToEdit,
	} as const;

	if (loading) {
		return (
			<div className='statement-settings-form'>
				<div className='loader-box'>
					<Loader />
				</div>
			</div>
		);
	}

	return (
		<div className='wrapper'>
			<form
				onSubmit={handleSubmit}
				className='statement-settings-form'
				data-cy='statement-settings-form'
			>
				<TitleAndDescription
					statement={statement}
					setStatementToEdit={setStatementToEdit}
				/>

				{error && <div className="error-message">{error}</div>}

				<SectionTitle title={t('General Settings')} />
				<section className='switches-area'>
					<AdvancedSettings {...statementSettingsProps} />
				</section>

				<button
					type='submit'
					className='submit-button btn'
					aria-label='Submit button'
					data-cy='settings-statement-submit-btn'
				>
					{t('Save')}
				</button>
			</form>

			<MembershipSettings statement={statement} setStatementToEdit={setStatementToEdit} />

			{statement.statementType === StatementType.question && (
				<ChoseBySettings {...statementSettingsProps} />
			)}

			{!isNewStatement && (
				<>
					<UploadImage
						statement={statementSettingsProps.statement}
						image={image}
						setImage={setImage}
					/>
					<QuestionSettings {...statementSettingsProps} />

					<SectionTitle title={t('Members')} />
					<section className='get-members-area'>
						<GetVoters
							statementId={statementId}
							joinedMembers={joinedMembers}
						/>
					</section>
					<section className='get-members-area'>
						<GetEvaluators statementId={statementId} />
					</section>
				</>
			)}
		</div>
	);
};

export default StatementSettingsForm;
