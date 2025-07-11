import { Fragment, h } from "vue";
import { useI18n } from "vue-i18n";
import { version } from "@common/constants";
import { useAppStore } from "@renderer/stores/appStore";
import { ServiceBridgeStatus } from "@renderer/bridges/serviceBridge";
import Msgbox from "../Msgbox/Msgbox";
import nodeBridge from "@renderer/bridges/nodeBridge";

export function showEnvironmentInfo() {
    const appStore = useAppStore();
    const { t } = useI18n();
    const backendInfo = [];

    const ffmpegEncoderInfo = appStore.currentServer.data.ffmpegInfo.version
        ? (appStore.currentServer.data.ffmpegInfo.scanning
            ? t('envInfo.scanningEncoders')
            : t('envInfo.encoderStats', { videoCount: appStore.currentServer.data.ffmpegInfo.videoEncodersCount, audioCount: appStore.currentServer.data.ffmpegInfo.audioEncodersCount }))
        : '';

    if (appStore.currentServer?.entity.status === ServiceBridgeStatus.Connected) {
        const connectionType = appStore.currentServer.entity.ip === 'localhost' ? t('envInfo.connectionTypeLocal') : t('envInfo.connectionTypeRemote');
        backendInfo.push(
            t('envInfo.backendConnectionType', { type: connectionType }),
            h('br'),
            t('envInfo.backendVersion', { version: appStore.currentServer.data.version }),
            h('br'),
            t('envInfo.backendEnv', { os: appStore.currentServer.data.os }),
            h('br'),
            t('envInfo.backendFFmpeg', { version: appStore.currentServer.data.ffmpegInfo.version, encoders: ffmpegEncoderInfo }),
        );
    }

    Msgbox({
        container: document.body,
        title: t('envInfo.title'),
        content: h(Fragment, [
            t('envInfo.frontendVersion', { version }),
            h('br'),
            t('envInfo.frontendEnv', { platform: navigator.platform }),
            h('br'),
            t('envInfo.frontendEngine', { engine: nodeBridge.env === 'electron' ? 'electron' : navigator.userAgent }),
            ...(backendInfo.length ? [h('br'), '·'] : []),
            ...(backendInfo.length ? [h('br'), ...backendInfo] : []),
        ]),
        buttons: [
            { text: t('envInfo.close'), role: 'cancel' },
        ]
    });
}
