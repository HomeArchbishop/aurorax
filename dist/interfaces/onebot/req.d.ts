import type { MessageSend, NodeSegment } from './message';
export type ApiActionName = 'send_private_msg' | 'send_group_msg' | 'send_msg' | 'delete_msg' | 'get_msg' | 'get_forward_msg' | 'send_like' | 'set_group_kick' | 'set_group_ban' | 'set_group_anonymous_ban' | 'set_group_whole_ban' | 'set_group_admin' | 'set_group_anonymous' | 'set_group_card' | 'set_group_name' | 'set_group_leave' | 'set_group_special_title' | 'set_friend_add_request' | 'set_group_add_request' | 'get_login_info' | 'get_stranger_info' | 'get_friend_list' | 'get_group_info' | 'get_group_list' | 'get_group_member_info' | 'get_group_member_list' | 'get_group_honor_info' | 'get_cookies' | 'get_csrf_token' | 'get_credentials' | 'get_record' | 'get_image' | 'can_send_image' | 'can_send_record' | 'get_status' | 'get_version_info' | 'set_restart' | 'clean_cache' | 'set_qq_profile' | 'qidian_get_account_info' | '_get_model_show' | '_set_model_show' | 'get_online_clients' | 'get_unidirectional_friend_list' | 'delete_unidirectional_friend' | 'delete_friend' | 'mark_msg_as_read' | 'send_group_forward_msg' | 'send_private_forward_msg' | 'get_group_msg_history' | 'ocr_image' | 'set_essence_msg' | 'delete_essence_msg' | 'get_essence_msg_list' | 'get_group_at_all_remain' | 'set_group_portrait' | 'send_group_sign' | '_send_group_notice' | '_get_group_notice' | 'upload_group_file' | 'delete_group_file' | 'create_group_file_folder' | 'delete_group_folder' | 'get_group_file_system_info' | 'get_group_root_files' | 'get_group_files_by_folder' | 'get_group_file_url' | 'upload_private_file' | 'download_file' | 'check_url_safely' | '.get_word_slices' | '.handle_quick_operation' | 'reload_event_filter';
interface RequestParamsMap {
    send_private_msg: SendPrivateMsgParams;
    send_group_msg: SendGroupMsgParams;
    send_msg: SendMsgParams;
    delete_msg: DeleteMsgParams;
    get_msg: GetMsgParams;
    get_forward_msg: GetForwardMsgParams;
    send_like: SendLikeParams;
    set_group_kick: SetGroupKickParams;
    set_group_ban: SetGroupBanParams;
    set_group_anonymous_ban: SetGroupAnonymousBanParams;
    set_group_whole_ban: SetGroupWholeBanParams;
    set_group_admin: SetGroupAdminParams;
    set_group_anonymous: SetGroupAnonymousParams;
    set_group_card: SetGroupCardParams;
    set_group_name: SetGroupNameParams;
    set_group_leave: SetGroupLeaveParams;
    set_group_special_title: SetGroupSpecialTitleParams;
    set_friend_add_request: SetFriendAddRequestParams;
    set_group_add_request: SetGroupAddRequestParams;
    get_login_info: NoParams;
    get_stranger_info: GetStrangerInfoParams;
    get_friend_list: NoParams;
    get_group_info: GetGroupInfoParams;
    get_group_list: NoParams;
    get_group_member_info: GetGroupMemberInfoParams;
    get_group_member_list: GetGroupMemberListParams;
    get_group_honor_info: GetGroupHonorInfoParams;
    get_cookies: GetCookiesParams;
    get_csrf_token: NoParams;
    get_credentials: GetCredentialsParams;
    get_record: GetRecordParams;
    get_image: GetImageParams;
    can_send_image: NoParams;
    can_send_record: NoParams;
    get_status: NoParams;
    get_version_info: NoParams;
    set_restart: SetRestartParams;
    clean_cache: NoParams;
    set_qq_profile: SetQQProfileParams;
    qidian_get_account_info: QidianGetAccountInfoParams;
    _get_model_show: GetModelShowParams;
    _set_model_show: SetModelShowParams;
    get_online_clients: GetOnlineClientsParams;
    get_unidirectional_friend_list: GetUnidirectionalFriendListParams;
    delete_unidirectional_friend: DeleteUnidirectionalFriendParams;
    delete_friend: DeleteFriendParams;
    mark_msg_as_read: MarkMsgAsReadParams;
    send_group_forward_msg: SendGroupForwardMsgParams;
    send_private_forward_msg: SendPrivateForwardMsgParams;
    get_group_msg_history: GetGroupMsgHistoryParams;
    ocr_image: OcrImageParams;
    set_essence_msg: SetEssenceMsgParams;
    delete_essence_msg: DeleteEssenceMsgParams;
    get_essence_msg_list: GetEssenceMsgListParams;
    get_group_at_all_remain: GetGroupAtAllRemainParams;
    set_group_portrait: SetGroupPortraitParams;
    send_group_sign: SendGroupSignParams;
    _send_group_notice: SendGroupNoticeParams;
    _get_group_notice: GetGroupNoticeParams;
    upload_group_file: UploadGroupFileParams;
    delete_group_file: DeleteGroupFileParams;
    create_group_file_folder: CreateGroupFileFolderParams;
    delete_group_folder: DeleteGroupFolderParams;
    get_group_file_system_info: GetGroupFileSystemInfoParams;
    get_group_root_files: GetGroupRootFilesParams;
    get_group_files_by_folder: GetGroupFilesByFolderParams;
    get_group_file_url: GetGroupFileUrlParams;
    upload_private_file: UploadPrivateFileParams;
    download_file: DownloadFileParams;
    check_url_safely: CheckUrlSafelyParams;
    '.get_word_slices': GetWordSlicesParams;
    '.handle_quick_operation': HandleQuickOperationParams;
    reload_event_filter: ReloadEventFilterParams;
}
export interface ApiRequest<T extends ApiActionName = ApiActionName> {
    action: T;
    params: RequestParamsMap[T];
    echo: string;
}
export interface SendPrivateMsgParams {
    user_id: number;
    message: MessageSend;
    auto_escape?: boolean;
}
export interface SendGroupMsgParams {
    group_id: number;
    message: MessageSend;
    auto_escape?: boolean;
}
export interface SendMsgParams {
    message_type?: 'private' | 'group';
    user_id?: number;
    group_id?: number;
    message: MessageSend;
    auto_escape?: boolean;
}
export interface DeleteMsgParams {
    message_id: number;
}
export interface GetMsgParams {
    message_id: number;
}
export interface GetForwardMsgParams {
    id: string;
}
export interface SendLikeParams {
    user_id: number;
    times?: number;
}
export interface SetGroupKickParams {
    group_id: number;
    user_id: number;
    reject_add_request?: boolean;
}
export interface SetGroupBanParams {
    group_id: number;
    user_id: number;
    duration?: number;
}
export interface SetGroupAnonymousBanParams {
    group_id: number;
    anonymous?: Record<string, any>;
    anonymous_flag?: string;
    duration?: number;
}
export interface SetGroupWholeBanParams {
    group_id: number;
    enable?: boolean;
}
export interface SetGroupAdminParams {
    group_id: number;
    user_id: number;
    enable?: boolean;
}
export interface SetGroupAnonymousParams {
    group_id: number;
    enable?: boolean;
}
export interface SetGroupCardParams {
    group_id: number;
    user_id: number;
    card?: string;
}
export interface SetGroupNameParams {
    group_id: number;
    group_name: string;
}
export interface SetGroupLeaveParams {
    group_id: number;
    is_dismiss?: boolean;
}
export interface SetGroupSpecialTitleParams {
    group_id: number;
    user_id: number;
    special_title?: string;
    duration?: number;
}
export interface SetFriendAddRequestParams {
    flag: string;
    approve?: boolean;
    remark?: string;
}
export interface SetGroupAddRequestParams {
    flag: string;
    sub_type: 'add' | 'invite';
    approve?: boolean;
    reason?: string;
}
export interface GetStrangerInfoParams {
    user_id: number;
    no_cache?: boolean;
}
export interface GetGroupInfoParams {
    group_id: number;
    no_cache?: boolean;
}
export interface GetGroupMemberInfoParams {
    group_id: number;
    user_id: number;
    no_cache?: boolean;
}
export interface GetGroupMemberListParams {
    group_id: number;
}
export interface GetGroupHonorInfoParams {
    group_id: number;
    type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all';
}
export interface GetCookiesParams {
    domain?: string;
}
export interface GetCredentialsParams {
    domain?: string;
}
export interface GetRecordParams {
    file: string;
    out_format: string;
}
export interface GetImageParams {
    file: string;
}
export interface SetRestartParams {
    delay?: number;
}
export interface SetQQProfileParams {
    nickname?: string;
    company?: string;
    email?: string;
    college?: string;
    personal_note?: string;
}
export interface QidianGetAccountInfoParams {
    no_cache?: boolean;
}
export interface GetModelShowParams {
    model: string;
}
export interface SetModelShowParams {
    model: string;
    model_show: boolean;
}
export interface GetOnlineClientsParams {
    no_cache?: boolean;
}
export interface GetUnidirectionalFriendListParams {
    no_cache?: boolean;
}
export interface DeleteUnidirectionalFriendParams {
    user_id: number;
}
export interface DeleteFriendParams {
    user_id: number;
}
export interface MarkMsgAsReadParams {
    message_id: number;
}
export interface SendGroupForwardMsgParams {
    group_id: number;
    messages: NodeSegment[];
}
export interface SendPrivateForwardMsgParams {
    user_id: number;
    messages: NodeSegment[];
}
export interface GetGroupMsgHistoryParams {
    message_seq?: number;
    group_id: number;
}
export interface OcrImageParams {
    image: string;
}
export interface SetEssenceMsgParams {
    message_id: number;
}
export interface DeleteEssenceMsgParams {
    message_id: number;
}
export interface GetEssenceMsgListParams {
    group_id: number;
}
export interface GetGroupAtAllRemainParams {
    group_id: number;
}
export interface SetGroupPortraitParams {
    group_id: number;
    file: string;
    cache?: number;
}
export interface SendGroupSignParams {
    group_id: number;
}
export interface SendGroupNoticeParams {
    group_id: number;
    content: string;
    image?: string;
}
export interface GetGroupNoticeParams {
    group_id: number;
}
export interface UploadGroupFileParams {
    group_id: number;
    file: string;
    name: string;
    folder?: string;
}
export interface DeleteGroupFileParams {
    group_id: number;
    file_id: string;
    busid: number;
}
export interface CreateGroupFileFolderParams {
    group_id: number;
    name: string;
    parent_id?: string;
}
export interface DeleteGroupFolderParams {
    group_id: number;
    folder_id: string;
}
export interface GetGroupFileSystemInfoParams {
    group_id: number;
}
export interface GetGroupRootFilesParams {
    group_id: number;
}
export interface GetGroupFilesByFolderParams {
    group_id: number;
    folder_id: string;
}
export interface GetGroupFileUrlParams {
    group_id: number;
    file_id: string;
    busid: number;
}
export interface UploadPrivateFileParams {
    user_id: number;
    file: string;
    name: string;
}
export interface DownloadFileParams {
    url: string;
    thread_count?: number;
    headers?: string | string[];
}
export interface CheckUrlSafelyParams {
    url: string;
}
export interface GetWordSlicesParams {
    content: string;
}
export interface HandleQuickOperationParams {
    context: Record<string, any>;
    operation: Record<string, any>;
}
export interface ReloadEventFilterParams {
    file: string;
}
type NoParams = Record<string, never>;
export {};
//# sourceMappingURL=req.d.ts.map