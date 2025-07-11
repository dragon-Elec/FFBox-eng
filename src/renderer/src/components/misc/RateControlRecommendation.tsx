import { defineComponent, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Msgbox from '../Msgbox/Msgbox';

export function showRateControlRecommendation() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(document.activeElement as any)?.blur();
	const { t } = useI18n();
	// 如果是从菜单通过 Enter 进入的，不加延迟的情况下，会连带触发 Msgbox 的键盘事件监听，因此需要加延迟
	setTimeout(() => {
		Msgbox({
			container: document.body,
			title: t('rateControlDoc.title'),
			content: <Comp />,
			buttons: [
				{ text: t('rateControlDoc.close'), role: 'cancel' },
			]
		});
	}, 0);
}

const Comp = defineComponent(() => {
	const iframeRef = ref<HTMLIFrameElement>();

	// function applyHeadStylesToIframe(iframe: HTMLIFrameElement) {
	// 	const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	
	// 	// 复制所有 <style> 标签
	// 	document.querySelectorAll('style').forEach(style => {
	// 		const clonedStyle = style.cloneNode(true);
	// 		iframeDoc.head.appendChild(clonedStyle);
	// 	});
	
	// 	// 复制所有 <link rel="stylesheet"> 标签
	// 	document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
	// 		const clonedLink = link.cloneNode(true);
	// 		iframeDoc.head.appendChild(clonedLink);
	// 	});
	// }

	// function applyComputedStylesToIframe(iframe: HTMLIFrameElement) {
	// 	const computedStyle = getComputedStyle(iframe);
	// 	const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	// 	const body = iframeDoc.body;
	// 	const html = iframeDoc.documentElement;
	
	// 	for (const prop of computedStyle) {
	// 		try {
	// 			body.style[prop] = computedStyle.getPropertyValue(prop);
	// 			html.style[prop] = computedStyle.getPropertyValue(prop);
	// 		} catch (e) {
	// 			// 某些样式是只读的，跳过
	// 		}
	// 	}
	// }
	
	onMounted(() => {
		// const myIframe = document.querySelector('#my-iframe');
		iframeRef.value.addEventListener('load', () => {
			// applyHeadStylesToIframe(iframeRef.value);
			// applyComputedStylesToIframe(iframeRef.value);
			const iframeDoc = iframeRef.value.contentDocument || iframeRef.value.contentWindow.document;
			iframeDoc.body.className = document.body.className;
		});
	});	
	
	return () => (
		<iframe ref={iframeRef} src="./markdown-render/index.html?url=../FFBox 推荐画质设定.md" style="width: 90vw; height: calc(100vh - 200px); border: none;"></iframe>
	);
});
