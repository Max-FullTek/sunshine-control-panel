/// Remove the retired integration on upgrade. This never registers a sender.
#[cfg(target_os = "windows")]
pub fn remove_retired_file_transfer_menu() -> Result<(), String> {
    use winreg::RegKey;
    use winreg::enums::HKEY_CURRENT_USER;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    match hkcu.delete_subkey_all(r"Software\Classes\*\shell\Sunshine.SendToClient") {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("remove retired context menu failed: {error}")),
    }
}
