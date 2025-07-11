import { defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import CryptoJS from 'crypto-js';
import { Server } from "@renderer/types";
import { useAppStore } from "@renderer/stores/appStore";
import { useTooltip } from "@renderer/common/tooltipUtil";
import nodeBridge from "@renderer/bridges/nodeBridge";
import Button from '@renderer/components/Button/Button';
import { ButtonType } from "../Button/Button";
import InputAutoSize from '@renderer/components/InputAutoSize/InputAutoSize.vue';
import Msgbox from "../Msgbox/Msgbox";
import style from './ServerUserConfig.module.less';
import { randomString } from "@common/utils";

export function showServerUserConfig(serverId: string) {
	let compFuncs: any;
	const appStore = useAppStore();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(document.activeElement as any)?.blur();
	const { t } = useI18n();

	Msgbox({
		container: document.body,
		title: t('serverUserConfig.title'),
		content: <Comp exportFunctions={(fs) => compFuncs = fs} serverId={serverId} />,
		buttons: [
			{ text: t('serverUserConfig.save'), role: 'confirm', type: ButtonType.Primary, callback: async () => {
				const result = await compFuncs.exportData();
				const { users } = result;
				nodeBridge.localConfig.set('service.users', users);
				const server = appStore.servers.find((server) => server.data.id === serverId) as Server;
				setTimeout(() => {
					// 留时间写盘完成后再通知服务器刷新
					server.entity.initSettings();
				}, 40);
			} },
			{ text: t('serverUserConfig.cancel'), role: 'cancel' },
		]
	});
}

interface P {
	serverId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	exportFunctions: (fs: any) => void;
}
const Comp = defineComponent((props: P) => {
	const { t } = useI18n();
	const usersValue = ref<{ username: string; passkey: string; maxFunctionLevel: number }[]>([]);
	const editingLineIndex = ref<number>(NaN);
	const editingAttr = ref<'username' | 'passkey' | 'maxFunctionLevel' | undefined>();

	const exports = {
		exportData: async () => {
			return {
				users: JSON.parse(JSON.stringify(usersValue.value)),
			};
		}
	};

	const handleEdit = (lineIndex: number, attr: 'username' | 'passkey' | 'maxFunctionLevel') => {
		const user = usersValue.value[lineIndex];
		if (attr === 'username') {
			if (!user.username) {
				// 管理员空账号
				return;
			}
			editingLineIndex.value = lineIndex;
			editingAttr.value = 'username';
		} else if (attr === 'passkey') {
			editingLineIndex.value = lineIndex;
			editingAttr.value = 'passkey';
		} else {
			if (!user.username) {
				// 管理员空账号
				return;
			}
			editingLineIndex.value = lineIndex;
			editingAttr.value = 'maxFunctionLevel';
		}
	};

	const handleBlur = (lineIndex: number, attr: 'username' | 'passkey' | 'maxFunctionLevel', value: string) => {
		const user = usersValue.value[lineIndex];
		if (attr === 'username') {
			user.username = value || user.username;
		} else if (attr === 'passkey') {
			user.passkey = value.length ? CryptoJS.SHA256(value).toString() : '';
		} else {
			if (!isNaN(+value)) {
				user.maxFunctionLevel = Math.max(0, Math.min(100, +value));
			} else {
				user.maxFunctionLevel = 0;
			}
		}
		editingLineIndex.value = NaN;
		editingAttr.value = undefined;
	};

	const handleDelete = (lineIndex: number) => {
		usersValue.value.splice(lineIndex, 1);
	};

	const handleAddUser = () => {
		usersValue.value.push({
			username: randomString(6),
			passkey: '',
			maxFunctionLevel: 0,
		});
	};

	onMounted(() => {
		props.exportFunctions(exports);
		(async () => {
			const currentUsers: { username: string; passkey: string; maxFunctionLevel: number }[]
				= (await nodeBridge.localConfig.get('service.users') as any) || [{ username : "", passkey: "", maxFunctionLevel: 100 }];
			usersValue.value = currentUsers;
		})();
	});

	return () => (
		<div class={style.serverUserConfig}>
			<table>
				<colgroup>
					<col style="width: 140px" />
					<col style="width: 80px" />
					<col style="width: 100px" />
					<col style="width: 80px" />
				</colgroup>
				<thead>
					<tr>
						<th>{t('serverUserConfig.username')}</th>
						<th>{t('serverUserConfig.password')}</th>
						<th>{t('serverUserConfig.maxLevel')}</th>
						<th>{t('serverUserConfig.actions')}</th>
					</tr>
				</thead>
				<tbody>
					{usersValue.value.map((user, lineIndex) => (
						<tr>
							{editingLineIndex.value === lineIndex && editingAttr.value === 'username' ? (
								<td>
									<InputAutoSize
										value={user.username}
										onBlur={(value: string) => handleBlur(lineIndex, 'username', value)}
										// onPressEnter={endEdit}
									/>
								</td>
							) : (
								user.username ? (
									<td class={style.editable} onClick={() => handleEdit(lineIndex, 'username')}>{user.username}</td>
								) : (
									<td><font {...useTooltip(t('serverUserConfig.adminTooltip'), 't')} style={{ opacity: 0.5 }}>{t('serverUserConfig.adminHint')}</font></td>
								)
							)}
							{editingLineIndex.value === lineIndex && editingAttr.value === 'passkey' ? (
								<td>
									<InputAutoSize
										value=""
										onBlur={(value: string) => handleBlur(lineIndex, 'passkey', value)}
										// onPressEnter={endEdit}
									/>
								</td>
							) : (
								<td onClick={() => handleEdit(lineIndex, 'passkey')}>
									{user.passkey ? <a class={style.editable}>{t('serverUserConfig.change')}</a> : <a class={style.editable} domPropsInnerHTML={t('serverUserConfig.add')}></a>}
								</td>
							)}
							{editingLineIndex.value === lineIndex && editingAttr.value === 'maxFunctionLevel' ? (
								<td>
									<InputAutoSize
										value={user.maxFunctionLevel + ''}
										onBlur={(value: string) => handleBlur(lineIndex, 'maxFunctionLevel', value)}
										// onPressEnter={endEdit}
									/>
								</td>
							) : (
								user.username ? (
									<td class={style.editable} {...useTooltip(t('serverUserConfig.levelTooltip'), 't')} onClick={() => handleEdit(lineIndex, 'maxFunctionLevel')}>{user.maxFunctionLevel}</td>
								) : (
									<td>{user.maxFunctionLevel}</td>
								)
							)}
							<td>
								{user.username ? <a class={style.editable} onClick={() => handleDelete(lineIndex)}>{t('serverUserConfig.delete')}</a> : ''}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<Button onClick={() => handleAddUser()}>{t('serverUserConfig.addUser')}</Button>
		</div>
	);
}, { props: ['serverId', 'exportFunctions'] });
