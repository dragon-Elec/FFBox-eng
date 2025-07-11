import { computed, defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Server } from "@renderer/types";
import { useAppStore } from "@renderer/stores/appStore";
import { useTooltip } from "@renderer/common/tooltipUtil";
import nodeBridge from "@renderer/bridges/nodeBridge";
import { showServerUserConfig } from "./ServerUserConfig";
import Button from '@renderer/components/Button/Button';
import BoxedNormalInput from '@renderer/components/NormalInput/BoxedNormalInput.vue';
import BoxedSwitch from '@renderer/components/Switch/BoxedSwitch.vue';
import { posIntegerFixer } from "@renderer/components/validatorAndFixer";
import { ButtonType } from "../Button/Button";
import Msgbox from "../Msgbox/Msgbox";
import style from './ServerConfig.module.less';

export function showServerConfig(serverId: string) {
	let compFuncs: any;
	const appStore = useAppStore();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(document.activeElement as any)?.blur();

	// Need to get t here because this function is not a component
	const { t } = useI18n();

	// 如果是从菜单通过 Enter 进入的，不加延迟的情况下，会连带触发 Msgbox 的键盘事件监听，因此需要加延迟
	setTimeout(() => {
		Msgbox({
			container: document.body,
			title: t('serverConfig.title'),
			content: <Comp exportFunctions={(fs) => compFuncs = fs} serverId={serverId} />,
			buttons: [
				{ text: t('serverConfig.save'), role: 'confirm', type: ButtonType.Primary, callback: async () => {
					const result = await compFuncs.exportData();
					const { maxThreads, customFFmpegPath, preserveUnfinishedTasks } = result;
					nodeBridge.localConfig.set('service.maxThreads', maxThreads);
					nodeBridge.localConfig.set('service.customFFmpegPath', customFFmpegPath);
					nodeBridge.localConfig.set('service.preserveUnfinishedTasks', preserveUnfinishedTasks);
					const server = appStore.servers.find((server) => server.data.id === serverId) as Server;
					setTimeout(() => {
						// 留时间写盘完成后再通知服务器刷新
						server.entity.initSettings();
					}, 40);
				} },
				{ text: t('serverConfig.cancel'), role: 'cancel' },
			]
		});
	}, 0);
}

interface P {
	serverId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportFunctions: (fs: any) => void;
}
const Comp = defineComponent((props: P) => {
	const { t } = useI18n();
	const appStore = useAppStore();
	const maxThreadsValue = ref<string>();
	const customFFmpegPathValue = ref<string>();
	const preserveUnfinishedTasksValue = ref(true);

	const exports = {
		exportData: async () => {
			return {
				maxThreads: +maxThreadsValue.value!,
				customFFmpegPath: customFFmpegPathValue.value,
				preserveUnfinishedTasks: preserveUnfinishedTasksValue.value,
			};
		}
	};

	const maxThreadsLimit = computed(() => appStore.functionLevel < 40 ? 6 : appStore.functionLevel < 60 ? 9 : 0);

	const maxTasksTooltipText = computed(() => {
		if (maxThreadsLimit.value) {
			return t('serverConfig.maxTasksTooltipWithLimit', { limit: maxThreadsLimit.value });
		}
		return t('serverConfig.maxTasksTooltip');
	});

	onMounted(() => {
		props.exportFunctions(exports);
		(async () => {
			const currentMaxThreads = (await nodeBridge.localConfig.get('service.maxThreads') as number) || 1;
			maxThreadsValue.value = currentMaxThreads + '';
			const currentCustomFFmpegPath = await nodeBridge.localConfig.get('service.customFFmpegPath') as string;
			customFFmpegPathValue.value = currentCustomFFmpegPath || '';
			const preserveUnfinishedTasks = await nodeBridge.localConfig.get('service.preserveUnfinishedTasks');
			preserveUnfinishedTasksValue.value = preserveUnfinishedTasks !== false; // Defaults to true if undefined
		})();
    });

	return () => (
		<div class={style.serverConfig}>
			<BoxedNormalInput
				title={t('serverConfig.maxTasks')} value={maxThreadsValue.value} onChange={(value: string) => maxThreadsValue.value = value} inputFixer={posIntegerFixer} placeholder="1"
				{ ...useTooltip(maxTasksTooltipText.value, 't') }
			/>
			<BoxedSwitch
				title={t('serverConfig.preserveTasks')} checked={preserveUnfinishedTasksValue.value} onChange={(value: boolean) => preserveUnfinishedTasksValue.value = value}
				{ ...useTooltip(t('serverConfig.preserveTasksTooltip'), 't')}
			/>
			<BoxedNormalInput
				title={t('serverConfig.ffmpegPath')} value={customFFmpegPathValue.value} onChange={(value: string) => customFFmpegPathValue.value = value} placeholder={t('serverConfig.ffmpegPathPlaceholder')} long={true}
				{ ...useTooltip(t('serverConfig.ffmpegPathTooltip'), 't')}
			/>
			<div style={{ margin: '12px' }}>
				<Button onClick={() => showServerUserConfig(props.serverId)}>{t('serverConfig.userConfig')}</Button>
			</div>
		</div>
	);
}, { props: ['serverId', 'exportFunctions'] });
