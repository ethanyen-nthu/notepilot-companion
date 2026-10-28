const { withXcodeProject, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const TARGET = 'NotePilotShare';

function configureProject(project, bundleIdentifier, version, buildNumber) {
  let target = Object.values(project.pbxNativeTargetSection()).find(
    (value) => typeof value === 'object' && value.name?.replaceAll('"', '') === TARGET,
  );
  if (!target) {
    // A single-target Expo template has neither section. xcode only adds the
    // dependency when both exist; without these the extension can fail to build.
    project.hash.project.objects.PBXTargetDependency ??= {};
    project.hash.project.objects.PBXContainerItemProxy ??= {};
    const created = project.addTarget(TARGET, 'app_extension', TARGET, `${bundleIdentifier}.share`);
    target = created.pbxNativeTarget;
    const group = project.addPbxGroup([], TARGET, TARGET);
    project.addToPbxGroup(
      { fileRef: group.uuid, basename: TARGET },
      project.getFirstProject().firstProject.mainGroup,
    );
    project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', created.uuid);
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', created.uuid);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', created.uuid);
    project.addSourceFile('ShareViewController.swift', { target: created.uuid }, group.uuid);
  }
  const configs =
    project.pbxXCConfigurationList()[target.buildConfigurationList].buildConfigurations;
  for (const config of configs) {
    const settings = project.pbxXCBuildConfigurationSection()[config.value].buildSettings;
    Object.assign(settings, {
      PRODUCT_BUNDLE_IDENTIFIER: `"${bundleIdentifier}.share"`,
      INFOPLIST_FILE: `"${TARGET}/Info.plist"`,
      SWIFT_VERSION: '5.0',
      IPHONEOS_DEPLOYMENT_TARGET: '16.4',
      TARGETED_DEVICE_FAMILY: '"1,2"',
      APPLICATION_EXTENSION_API_ONLY: 'YES',
      CODE_SIGN_STYLE: 'Automatic',
      GENERATE_INFOPLIST_FILE: 'NO',
      CLANG_ENABLE_MODULES: 'YES',
      MARKETING_VERSION: `"${version}"`,
      CURRENT_PROJECT_VERSION: `"${buildNumber}"`,
      SDKROOT: 'iphoneos',
      SWIFT_EMIT_LOC_STRINGS: 'YES',
    });
  }
  return project;
}

function withNotePilotShare(config) {
  if (!config.ios?.bundleIdentifier)
    throw new Error('Set ios.bundleIdentifier before adding NotePilotShare.');
  config = withDangerousMod(config, [
    'ios',
    async (mod) => {
      const destination = path.join(mod.modRequest.platformProjectRoot, TARGET);
      fs.mkdirSync(destination, { recursive: true });
      for (const file of ['ShareViewController.swift', 'Info.plist']) {
        fs.copyFileSync(
          path.join(mod.modRequest.projectRoot, 'native', TARGET, file),
          path.join(destination, file),
        );
      }
      return mod;
    },
  ]);
  return withXcodeProject(config, (mod) => {
    configureProject(
      mod.modResults,
      config.ios.bundleIdentifier,
      config.version,
      config.ios.buildNumber ?? '1',
    );
    return mod;
  });
}
module.exports = withNotePilotShare;
module.exports.configureProject = configureProject;
