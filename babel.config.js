module.exports = function (api) {
    api.cache(true);
    return{
        presets: ["babel-preset-expo"],
        plugins: [
            "expo-router/babel",
            "react-native-reanimated/plugin",
           [ "module-resolver",
            {
                root: ['./'],
                alias: {
                  '@': './',
                },
              },
           ],
        ],
    };
};