﻿module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);
    require('grunt-karma')(grunt);

    //cant load this with require
    grunt.loadNpmTasks('grunt-dart-sass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-banner');

    if (grunt.option('target') && !grunt.file.isDir(grunt.option('target'))) {
        grunt.fail.warn('The --target option specified is not a valid directory');
    }

    grunt.initConfig({
        packageVersion: function () {
            var buildVersion = grunt.option('buildversion') || '2.0.0',
                packageSuffix = grunt.option('packagesuffix') || 'build',
                buildBranch = grunt.option('buildbranch') || 'master';

            var findPoint = buildVersion.lastIndexOf('.');
            var basePackageVer = buildVersion.substring(0, findPoint);
            var buildNumber = buildVersion.substring(findPoint + 1, buildVersion.length);
            if (buildBranch.toLowerCase() !== 'release') {
                return basePackageVer + '-' + 'build' + buildNumber;
            } else if (packageSuffix !== 'build' && packageSuffix.length > 0) {
                return basePackageVer + '-' + packageSuffix;
            } else {
                return basePackageVer;
            }
        },
        pkg: grunt.file.readJSON('package.json'),
        dest: grunt.option('target') || '../dist',
        basePath: 'App_Plugins/Tabulate',
        banner:
            '*! <%= pkg.title || pkg.name %> - v<%= packageVersion() %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;\n' +
            ' * Licensed <%= pkg.license %>\n *',

        browserify: {
            dist: {
                files: {
                    // destination for transpiled js : source js
                    '<%= dest %>/<%= basePath %>/backoffice/js/tabulate.js': '<%= basePath %>/backoffice/tabulate.es6'
                },
                options: {
                    transform: [['babelify', { presets: 'env' }]],
                    browserifyOptions: {
                        debug: false
                    }
                }
            }
        },

        //Concat all the JS files into one
        concat: {
            dist: {
                src: [
                  '<%= basePath %>/backoffice/**/*.js',
                ],
                dest: '<%= basePath %>/backoffice/tabulate.es6',
                nonull: true,
                options: {
                    banner: '/<%= banner %>/\n\n'
                }
            }
        },

        //Compile the less file into a CSS file
        'dart-sass': {
            target: {
                files: {
                    '<%= basePath %>/backoffice/style.min.css': ['<%= basePath %>/backoffice/style.scss']
                },
            }
        },

        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: '<%= basePath %>/backoffice',
                    src: ['*.css'],
                    dest: '<%= dest %>/<%= basePath %>/backoffice',
                    ext: '.min.css'
                }]
            },
            add_banner: {
                files: {
                    '<%= dest %>/<%= basePath %>/backoffice/style.min.css': ['<%= dest %>/<%= basePath %>/backoffice/style.min.css']
                }
            }
        },

        watch: {

            // dev watches everything, copies everything
            dev: {
                files: ['<%= basePath %>/**/*'],
                tasks: ['dart-sass', 'copy:dev'],
                options: {
                    livereload: true
                }
            },

            css: {
                files: ['<%= basePath %>/**/*.scss'],
                tasks: ['dart-sass']
            },

            js: {
                files: ['<%= basePath %>/**/*.js'],
                tasks: ['concat:dist']
            },

            html: {
                files: ['<%= basePath %>/**/*.html'],
                tasks: ['copy:views']
            },
            
            config: {
                files: ['<%= basePath %>/package.manifest'],
                tasks: ['copy:config']
            },
            
            lang: {
                files: ['<%= basePath %>/lang/**'],
                tasks: ['copy:lang']
            }

        },

        copy: {
            dev: {
                expand: true,
                cwd: '<%= basePath %>/',
                src: '**/*',
                dest: '../tabulate.site/<%= basePath %>/',
            },

            config: {
                src: '<%= basePath %>/dist.manifest', // dist.manifest only references the compiled, prod-ready css/js
                dest: '<%= dest %>/<%= basePath %>/package.manifest',
            },

            js: {
                expand: true,
                cwd: '<%= basePath %>/backoffice/',
                src: '**/*.js',
                dest: '<%= dest %>/<%= basePath %>/backoffice/',
            },

            html: {
                expand: true,
                cwd: '<%= basePath %>/backoffice/',
                src: '**/*.html',
                dest: '<%= dest %>/<%= basePath %>/backoffice/',
            },

            lang: {
                expand: true,
                cwd: '<%= basePath %>/lang/',
                src: '**',
                dest: '<%= dest %>/<%= basePath %>/lang',
            },

            nuget: {
                expand: true,
                cwd: '<%= dest %>',
                src: '<%= basePath %>/**',
                dest: 'tmp/nuget/content/'
            },

            umbraco: {
                expand: true,
                cwd: '<%= dest %>/',
                src: '<%= basePath %>/**',
                dest: 'tmp/umbraco/'
            },

            testAssets: {
                expand: true,
                cwd: '<%= dest %>',
                src: ['js/umbraco.*.js', 'lib/**/*.js'],
                dest: 'test/assets/'
            }
        },

        template: {
            nuspec: {
                options: {
                    data: {
                        name: '<%= pkg.name %>',
                        version: '<%= pkg.version %>',
                        author: '<%= pkg.author.name %>',
                        description: '<%= pkg.description %>'
                    }
                },
                files: {
                    'tmp/nuget/<%= pkg.name %>.nuspec': 'config/package.nuspec'
                }
            }
        },

        mkdir: {
            pkg: {
                options: {
                    create: ['pkg/nuget', 'pkg/umbraco']
                },
            },
        },

        nugetpack: {
            dist: {
                src: 'tmp/nuget/<%= pkg.name %>.nuspec',
                dest: 'pkg/nuget/'
            }
        },

        umbracoPackage: {
            dist: {
                src: 'tmp/umbraco',
                dest: 'pkg/umbraco',
                options: {
                    name: '<%= pkg.name %>',
                    version: '<%= pkg.version %>',
                    url: '<%= pkg.url %>',
                    license: '<%= pkg.license %>',
                    licenseUrl: '<%= pkg.licenseUrl %>',
                    author: '<%= pkg.author.name %>',
                    authorUrl: '<%= pkg.author.url %>'
                }
            }
        },

        clean: {
            dist: '[object Object]',
            test: 'test/assets'
        },

        karma: {
            unit: {
                configFile: 'test/karma.conf.js'
            }
        },

        jshint: {
            dev: {
                files: {
                    src: ['app_plugins/**/*.js']
                },
                options: {
                    curly: true,
                    eqeqeq: false,
                    esversion: 6,
                    immed: true,
                    latedef: false,
                    newcap: false,
                    noarg: true,
                    sub: true,
                    boss: true,
                    eqnull: true,
                    validthis: true,
                    //NOTE: we need to check for strings such as "javascript:" so don't throw errors regarding those
                    scripturl: true,
                    //NOTE: we ignore tabs vs spaces because enforcing that causes lots of errors depending on the text editor being used
                    smarttabs: true,
                    globals: {},
                    force: true
                }
            }
        }
    });

    grunt.registerTask('default', ['jshint', 'concat', 'browserify', 'dart-sass', 'cssmin', 'copy:config', 'copy:html', 'copy:lang']);
    grunt.registerTask('nuget', ['clean', 'default', 'copy:nuget', 'template:nuspec', 'mkdir:pkg', 'nugetpack']);
    grunt.registerTask('package', ['clean', 'default', 'copy:umbraco', 'mkdir:pkg', 'umbracoPackage']);

    grunt.registerTask('dev', ['watch:dev']);

    grunt.registerTask('test', 'Clean, copy test assets, test', function () {
        var assetsDir = grunt.config.get('dest');
        //copies over umbraco assets from --target, this must point at the /umbraco/ directory
        if (assetsDir !== 'dist') {
            grunt.task.run(['clean:test', 'copy:testAssets', 'karma']);
        } else if (grunt.file.isDir('test/assets/js/')) {
            grunt.log.oklns('Test assets found, running tests');
            grunt.task.run(['karma']);
        } else {
            grunt.log.errorlns('Tests assets not found, skipping tests');
        }
    });

};
