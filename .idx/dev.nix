{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_18
    pkgs.nodePackages.http-server
  ];

  # Sets environment variables in the workspace
  env = {};

  # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
  idx.extensions = [];

  # Enable previews and customize configuration
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "http-server"
          "xrsrc"
          "-p"
          "$PORT"
          "--cors"
          "-c-1"  # Disable caching
          "-a"
          "0.0.0.0"
        ];
        manager = "web";
      };
      # pr1 = {
      #   command = [
      #     "http-server"
      #     "xrsrc/pr1"
      #     "-p"
      #     "$PORT"
      #     "--cors"
      #     "-c-1"  # Disable caching
      #     "-a"
      #     "0.0.0.0"
      #   ];
      #   manager = "web";
      # };
      # webxr_project = {
      #   command = [
      #     "http-server"
      #     "webxr-project"
      #     "-p"
      #     "$PORT"
      #     "--cors"
      #     "-c-1"  # Disable caching
      #     "-a"
      #     "0.0.0.0"
      #   ];
      #   manager = "web";
      # };
    };
  };
}
