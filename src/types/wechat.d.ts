// 微信小程序类型声明
declare global {
  interface Window {
    wx?: {
      miniProgram?: {
        navigateTo: (options: { url: string; success?: () => void; fail?: (error: any) => void }) => void
        redirectTo: (options: { url: string }) => void
        switchTab: (options: { url: string }) => void
        reLaunch: (options: { url: string }) => void
        postMessage: (data: any) => void
        getEnv: (callback: (res: { miniprogram: boolean }) => void) => void
      }
      config: (config: any) => void
      ready: (callback: () => void) => void
      error: (callback: (res: any) => void) => void
      checkJsApi: (options: any) => void
      onMenuShareTimeline: (options: any) => void
      onMenuShareAppMessage: (options: any) => void
      onMenuShareQQ: (options: any) => void
      onMenuShareWeibo: (options: any) => void
      onMenuShareQZone: (options: any) => void
      updateAppMessageShareData: (options: any) => void
      updateTimelineShareData: (options: any) => void
      chooseImage: (options: any) => void
      previewImage: (options: any) => void
      uploadImage: (options: any) => void
      downloadImage: (options: any) => void
      getLocalImgData: (options: any) => void
      startRecord: (options: any) => void
      stopRecord: (options: any) => void
      onVoiceRecordEnd: (options: any) => void
      playVoice: (options: any) => void
      pauseVoice: (options: any) => void
      stopVoice: (options: any) => void
      onVoicePlayEnd: (options: any) => void
      uploadVoice: (options: any) => void
      downloadVoice: (options: any) => void
      translateVoice: (options: any) => void
      getNetworkType: (options: any) => void
      openLocation: (options: any) => void
      getLocation: (options: any) => void
      hideMenuItems: (options: any) => void
      showMenuItems: (options: any) => void
      hideAllNonBaseMenuItem: () => void
      showAllNonBaseMenuItem: () => void
      closeWindow: () => void
      scanQRCode: (options: any) => void
      chooseWXPay: (options: any) => void
      openProductSpecificView: (options: any) => void
      addCard: (options: any) => void
      chooseCard: (options: any) => void
      openCard: (options: any) => void
      consumeAndShareCard: (options: any) => void
      getBrandWCPayRequestParams: (options: any) => void
      invoke: (options: any) => void
      invokePayment: (options: any) => void
      invokeMiniProgramAPI: (options: any) => void
      invokeCloudAPI: (options: any) => void
      invokeServiceAPI: (options: any) => void
      invokePluginAPI: (options: any) => void
      invokeThirdPartyAPI: (options: any) => void
      invokeCustomAPI: (options: any) => void
      invokeNativeAPI: (options: any) => void
      invokeWebAPI: (options: any) => void
      invokeHybridAPI: (options: any) => void
      invokeCrossPlatformAPI: (options: any) => void
      invokeUniversalAPI: (options: any) => void
      invokeGlobalAPI: (options: any) => void
      invokeLocalAPI: (options: any) => void
      invokeRemoteAPI: (options: any) => void
      invokeAsyncAPI: (options: any) => void
      invokeSyncAPI: (options: any) => void
      invokeCallbackAPI: (options: any) => void
      invokePromiseAPI: (options: any) => void
      invokeObservableAPI: (options: any) => void
      invokeStreamAPI: (options: any) => void
      invokeBatchAPI: (options: any) => void
      invokeParallelAPI: (options: any) => void
      invokeSequentialAPI: (options: any) => void
      invokeConcurrentAPI: (options: any) => void
      invokeRaceAPI: (options: any) => void
      invokeAllAPI: (options: any) => void
      invokeSettledAPI: (options: any) => void
      invokeAnyAPI: (options: any) => void
      invokeNoneAPI: (options: any) => void
      invokeSomeAPI: (options: any) => void
      invokeEveryAPI: (options: any) => void
      invokeFilterAPI: (options: any) => void
      invokeMapAPI: (options: any) => void
      invokeReduceAPI: (options: any) => void
      invokeFindAPI: (options: any) => void
      invokeFindIndexAPI: (options: any) => void
      invokeIncludesAPI: (options: any) => void
      invokeIndexOfAPI: (options: any) => void
      invokeLastIndexOfAPI: (options: any) => void
      invokeSliceAPI: (options: any) => void
      invokeSpliceAPI: (options: any) => void
      invokePushAPI: (options: any) => void
      invokePopAPI: (options: any) => void
      invokeShiftAPI: (options: any) => void
      invokeUnshiftAPI: (options: any) => void
      invokeConcatAPI: (options: any) => void
      invokeJoinAPI: (options: any) => void
      invokeReverseAPI: (options: any) => void
      invokeSortAPI: (options: any) => void
      invokeToStringAPI: (options: any) => void
      invokeValueOfAPI: (options: any) => void
      invokeToLocaleStringAPI: (options: any) => void
      invokeIsArrayAPI: (options: any) => void
      invokeFromAPI: (options: any) => void
      invokeOfAPI: (options: any) => void
      invokeKeysAPI: (options: any) => void
      invokeValuesAPI: (options: any) => void
      invokeEntriesAPI: (options: any) => void
      invokeAssignAPI: (options: any) => void
      invokeCreateAPI: (options: any) => void
      invokeDefinePropertyAPI: (options: any) => void
      invokeDefinePropertiesAPI: (options: any) => void
      invokeFreezeAPI: (options: any) => void
      invokeSealAPI: (options: any) => void
      invokePreventExtensionsAPI: (options: any) => void
      invokeIsExtensibleAPI: (options: any) => void
      invokeIsFrozenAPI: (options: any) => void
      invokeIsSealedAPI: (options: any) => void
      invokeGetOwnPropertyDescriptorAPI: (options: any) => void
      invokeGetOwnPropertyDescriptorsAPI: (options: any) => void
      invokeGetOwnPropertyNamesAPI: (options: any) => void
      invokeGetOwnPropertySymbolsAPI: (options: any) => void
      invokeGetPrototypeOfAPI: (options: any) => void
      invokeSetPrototypeOfAPI: (options: any) => void
      invokeIsPrototypeOfAPI: (options: any) => void
      invokeHasOwnPropertyAPI: (options: any) => void
      invokePropertyIsEnumerableAPI: (options: any) => void
      invokeToStringAPI: (options: any) => void
      invokeValueOfAPI: (options: any) => void
      invokeToLocaleStringAPI: (options: any) => void
      invokeIsArrayAPI: (options: any) => void
      invokeFromAPI: (options: any) => void
      invokeOfAPI: (options: any) => void
      invokeKeysAPI: (options: any) => void
      invokeValuesAPI: (options: any) => void
      invokeEntriesAPI: (options: any) => void
      invokeAssignAPI: (options: any) => void
      invokeCreateAPI: (options: any) => void
      invokeDefinePropertyAPI: (options: any) => void
      invokeDefinePropertiesAPI: (options: any) => void
      invokeFreezeAPI: (options: any) => void
      invokeSealAPI: (options: any) => void
      invokePreventExtensionsAPI: (options: any) => void
      invokeIsExtensibleAPI: (options: any) => void
      invokeIsFrozenAPI: (options: any) => void
      invokeIsSealedAPI: (options: any) => void
      invokeGetOwnPropertyDescriptorAPI: (options: any) => void
      invokeGetOwnPropertyDescriptorsAPI: (options: any) => void
      invokeGetOwnPropertyNamesAPI: (options: any) => void
      invokeGetOwnPropertySymbolsAPI: (options: any) => void
      invokeGetPrototypeOfAPI: (options: any) => void
      invokeSetPrototypeOfAPI: (options: any) => void
      invokeIsPrototypeOfAPI: (options: any) => void
      invokeHasOwnPropertyAPI: (options: any) => void
      invokePropertyIsEnumerableAPI: (options: any) => void
    }
    __wxConfig?: any
    analytics?: any
  }

  interface Navigator {
    connection?: {
      effectiveType?: string
      downlink?: number
      rtt?: number
    }
  }

  namespace NodeJS {
    interface Timeout {
      _idleTimeout?: number
      _idleStart?: number
      _idleNext?: Timeout
      _idlePrev?: Timeout
    }
  }

  // 全局函数声明
  function openDatabase(
    name: string,
    version: string,
    displayName: string,
    estimatedSize: number,
    creationCallback?: (database: any) => void
  ): any

  // 常量定义
  const positive: string
  const negative: string
  const neutral: string
}

export {}
